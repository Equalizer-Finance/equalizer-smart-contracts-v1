import { expect } from 'chai';
import { ethers, waffle } from 'hardhat';
const { deployContract } = waffle;
import { Wallet } from 'ethers';
import BigNumber from 'bignumber.js';

import FlashBorrowerMockArtifact from '../artifacts/contracts/mock/FlashBorrowerMock.sol/FlashBorrowerMock.json';
import VaultFactoryArtifact from '../artifacts/contracts/VaultFactory.sol/VaultFactory.json';
import ERC20TokenMockArtifact from '../artifacts/contracts/mock/ERC20TokenMock.sol/ERC20TokenMock.json';
import FlashLoanProviderArtifact from '../artifacts/contracts/FlashLoanProvider.sol/FlashLoanProvider.json';

import {
  Vault,
  ERC20EToken,
  FlashBorrowerMock,
  VaultFactory,
  ERC20,
  ERC20TokenMock,
  FlashLoanProvider,
} from '../typechain';

describe('Vault', async () => {
  let ERC20;
  let ERC20EToken;

  // Deployment
  let eqzToken;
  let usdcToken;
  let usdtToken;
  let daiToken;
  let vault = null;
  let vaultFactory = null;
  let flashBorrower = null;
  let flashLoanProvider = null;

  // Addresses
  let owner, addr1;

  // Constants
  const TREASURY_ADDRESS = '0x4D4049D43CeF24dEe359F9e3091dB83b0bE4Bc1d';
  const USDC_TOKEN_DECIMALS = 6;
  const usdcTokenBnDecimals = new BigNumber(10).pow(USDC_TOKEN_DECIMALS);
  const ratioDecimals = 10 ** 6;
  const DEPOSIT_VALUE = new BigNumber(50).multipliedBy(usdcTokenBnDecimals).toString();
  const FLASH_FEE_PERCENTAGE_BN = new BigNumber(5);
  const FLASH_FEE_AMOUNT_DIVIDER = 10000;
  const FLASH_LOAN_MINT_USDC_TOKEN_BN = new BigNumber(220).multipliedBy(usdcTokenBnDecimals);
  const FLASH_LOAN_MINT_BORROW_USDC_BN = new BigNumber(40).multipliedBy(usdcTokenBnDecimals);
  const USDC_VAULT_MAX_CAPACITY_BN = new BigNumber(100000).multipliedBy(usdcTokenBnDecimals);
  const VAULT_MAX_CAPACITY_BN = new BigNumber(100000).multipliedBy(usdcTokenBnDecimals);
  const TREASURY_PERCENTAGE = 10;

  before(async () => {
    ERC20 = await ethers.getContractFactory('ERC20');
    ERC20EToken = await ethers.getContractFactory('ERC20EToken');
    [owner, addr1] = await ethers.getSigners();

    eqzToken = await ERC20.deploy('Equalizer', 'EQZ');

    // Deployed with ERC20Token to have mint available
    usdcToken = (await deployContract(<Wallet>owner, ERC20TokenMockArtifact, [
      'USD Coin',
      'USDC',
      6,
    ])) as ERC20TokenMock;

    usdtToken = (await deployContract(<Wallet>owner, ERC20TokenMockArtifact, [
      'USDT',
      'usdt',
      6,
    ])) as ERC20TokenMock;

    daiToken = (await deployContract(<Wallet>owner, ERC20TokenMockArtifact, [
      'DAI',
      'dai',
      18,
    ])) as ERC20TokenMock;

    await eqzToken.deployed();
    await usdcToken.deployed();

    vaultFactory = (await deployContract(<Wallet>owner, VaultFactoryArtifact, [])) as VaultFactory;

    flashLoanProvider = (await deployContract(<Wallet>owner, FlashLoanProviderArtifact, [
      vaultFactory.address,
    ])) as FlashLoanProvider;

    await vaultFactory.initialize(flashLoanProvider.address, usdcToken.address);

    await vaultFactory.functions['createVault(address,uint256)'](
      usdcToken.address,
      VAULT_MAX_CAPACITY_BN.toString(10)
    );

    vault = await ethers.getContractAt('Vault', await vaultFactory.vaults(0));

    flashBorrower = (await deployContract(<Wallet>owner, FlashBorrowerMockArtifact, [
      flashLoanProvider.address,
      vaultFactory.address,
    ])) as FlashBorrowerMock;
  });

  //-------- VaultFactory --------
  it('Should revert to initialize already initialized VaultFactory', async () => {
    expect(
      vaultFactory.initialize(flashLoanProvider.address, usdcToken.address)
    ).to.be.revertedWith(`ONLY_NOT_INITIALIZED`);
  });

  it('Should set new treasury address', async () => {
    await vaultFactory.setTreasuryAddress(addr1.address);
    expect(await vaultFactory.treasuryAddress()).to.equal(addr1.address);
  });

  it('Should be able to change fee to publish vault', async () => {
    await vaultFactory.setFeeToPublishVault(100);
    expect(await vaultFactory.feeToPublishVault()).to.equal(100);
  });

  //-------- Vault --------
  it('Should let ONLY admin initialize vault', async () => {
    expect(
      vault
        .connect(addr1)
        .initialize(TREASURY_ADDRESS, usdcToken.address, USDC_VAULT_MAX_CAPACITY_BN.toString(10))
    ).to.be.revertedWith(`Moderator: caller is not the moderator`);
  });

  it('Should be able to set max capacity as an moderator', async () => {
    await vault.setMaxCapacity(VAULT_MAX_CAPACITY_BN.plus(100).toString());
    expect((await vault.maxCapacity()).toString()).to.equal(
      VAULT_MAX_CAPACITY_BN.plus(100).toString()
    );
  });

  it('Should NOT be able to set VaultFactory fee for publishing vault if not moderator', async () => {
    expect(vaultFactory.connect(addr1).setFeeToPublishVault(200)).to.be.revertedWith(
      'revert Moderator: caller is not the moderator'
    );
  });

  it('Should set min amount for flash', async () => {
    await vault.setMinAmountForFlash(100);

    expect(await vault.minAmountForFlash()).to.equal(100);
  });

  it('Should BE initialized', async () => {
    expect(await vault.isInitialized()).to.equal(true);
  });

  it('Moderator can pause/unpause vault', async function () {
    expect(await vault.isPaused()).to.equal(false);

    await vault.pauseVault();
    expect(await vault.isPaused()).to.equal(true);

    await vault.unpauseVault();
    expect(await vault.isPaused()).to.equal(false);
  });

  it('Account can deposit USDC and receive eUSDC', async function () {
    const eUsdcAddr = vault.address;
    const eUsdcToken = await ethers.getContractAt('ERC20EToken', eUsdcAddr);
    const initialAmount = new BigNumber(1000000).multipliedBy(usdcTokenBnDecimals).toString(10);

    // Expect wallet to have 1000 USDC
    expect((await usdcToken.balanceOf(owner.address)).toString()).to.equal(
      initialAmount.toString()
    );

    // Approve allowance
    await usdcToken.approve(vault.address, ethers.constants.MaxUint256);

    // Expect wallet to have 0 eUSDC
    expect((await eUsdcToken.balanceOf(owner.address)).toString()).to.equal('0');

    // Expect vault to have 0 USDC
    expect((await usdcToken.balanceOf(vault.address)).toString()).to.equal('0');

    await vault.provideLiquidity(DEPOSIT_VALUE, 0);

    // Expect vault to have 50 USDC
    expect((await usdcToken.balanceOf(vault.address)).toString()).to.equal(DEPOSIT_VALUE);

    // Expect depositer to have 50 eUSDC
    expect((await eUsdcToken.balanceOf(owner.address)).toString()).to.equal(DEPOSIT_VALUE);
  });

  it('Should revert if you provide 0 Liquidity', async () => {
    expect(vault.provideLiquidity(0, 0)).to.be.revertedWith('CANNOT_STAKE_ZERO_TOKENS');
  });

  it('Last deposit block number should be different from zero', async () => {
    expect((await vault.lastDepositBlockNr(owner.address)).toString()).to.not.equal('0');
  });

  it('Should have last deposit block number in the event', async () => {
    const filter = await vault.filters.Deposit();
    const lastDepositBlockNr = (await vault.lastDepositBlockNr(owner.address)).toString();
    const found = await vault.queryFilter(
      filter,
      parseInt(lastDepositBlockNr, 10),
      parseInt(lastDepositBlockNr, 10)
    );
    expect(found[0].args['previousDepositBlockNr'].toString()).to.equal('0');
  });

  it('Should update totalAmountDeposited', async () => {
    expect(await vault.totalAmountDeposited()).to.equal(DEPOSIT_VALUE);
  });

  it('Should receive one eToken for one token deposited', async () => {
    expect(await vault.getRatioForOneEToken()).to.equal(
      new BigNumber(1).multipliedBy(ratioDecimals).toString()
    );
  });

  it('Should execute flash loan', async () => {
    // Mint tokens to flash borrower contract
    await usdcToken
      .connect(owner)
      .transfer(flashBorrower.address, FLASH_LOAN_MINT_USDC_TOKEN_BN.toString());

    const initialVaultBalance = await usdcToken.balanceOf(vault.address);
    const initialFlashBorrowerMockBalance = new BigNumber(
      (await usdcToken.balanceOf(flashBorrower.address)).toString()
    );
    const flashLoanValue = FLASH_LOAN_MINT_BORROW_USDC_BN;
    const fee = FLASH_FEE_PERCENTAGE_BN.multipliedBy(flashLoanValue).div(FLASH_FEE_AMOUNT_DIVIDER);

    const shouldHaveBalanceBorrower = initialFlashBorrowerMockBalance.minus(fee);
    const shouldHaveVault = FLASH_FEE_PERCENTAGE_BN.multipliedBy(flashLoanValue)
      .div(FLASH_FEE_AMOUNT_DIVIDER)
      .plus(initialVaultBalance.toString());
    const treasuryPercentage = new BigNumber(TREASURY_PERCENTAGE).multipliedBy(fee).div(100);

    await flashBorrower.flashBorrow(usdcToken.address, FLASH_LOAN_MINT_BORROW_USDC_BN.toString());

    expect(await usdcToken.balanceOf(flashBorrower.address)).to.equal(
      shouldHaveBalanceBorrower.toString()
    );
    expect(await usdcToken.balanceOf(vault.address)).to.equal(
      shouldHaveVault.minus(treasuryPercentage).toString()
    );
  });

  it('Price should be updated after flash loan', async () => {
    const tokenDepositedBn = await usdcToken.balanceOf(vault.address);
    const tokenMintedBn = await vault.totalSupply();

    expect(await vault.getRatioForOneEToken()).to.equal(
      tokenDepositedBn.mul(ratioDecimals).div(tokenMintedBn)
    );
  });

  it('For one deposited token should receive less than one eToken', async () => {
    const ratio = await vault.getRatioForOneEToken();
    const ratioBn = new BigNumber(ratio.toString());
    expect(ratioBn.div(ratioDecimals).toNumber()).to.be.greaterThan(1);
  });

  it('For a number of tokens deposited should receive less eTokens', async () => {
    const eUsdcAddr = vault.address;
    const eUsdcToken = await ethers.getContractAt('ERC20EToken', eUsdcAddr);
    const tokenDepositedBn = new BigNumber(90).multipliedBy(usdcTokenBnDecimals);
    const tokenDeposited = tokenDepositedBn.toString();

    const ratio = (await vault.getRatioForOneEToken()).toString();

    await usdcToken.connect(owner).transfer(addr1.address, tokenDeposited);
    await usdcToken.connect(addr1).approve(vault.address, tokenDeposited);
    await vault.connect(addr1).provideLiquidity(tokenDeposited, 0);

    const shouldReceiveBalance = `${parseInt(
      tokenDepositedBn.multipliedBy(ratioDecimals).div(ratio).toString(),
      10
    )}`;

    const receivedBalance = (await vault.balanceOf(addr1.address)).toString();
    const balanceEUSDC = (await eUsdcToken.balanceOf(addr1.address)).toString();

    expect(receivedBalance).to.equal(shouldReceiveBalance);
    expect(balanceEUSDC).to.equal(shouldReceiveBalance);
  });

  it('Should withdraw a part from vault', async () => {
    const eUsdcTokenBalanceBn = new BigNumber((await vault.balanceOf(addr1.address)).toString());
    const withdrawBalanceBn = new BigNumber(10).multipliedBy(usdcTokenBnDecimals);

    await vault.connect(addr1).approve(vault.address, ethers.constants.MaxUint256);
    await vault.connect(addr1).removeLiquidity(withdrawBalanceBn.toString());
    expect((await vault.balanceOf(addr1.address)).toString()).to.equal(
      eUsdcTokenBalanceBn.minus(withdrawBalanceBn).toString()
    );
  });

  it ('should fail if sandwitched', async () => {
    const eUsdcAddr = vault.address;
    const eUsdcToken = await ethers.getContractAt('ERC20EToken', eUsdcAddr);
    const tokenDepositedBn = new BigNumber(90).multipliedBy(usdcTokenBnDecimals);
    const tokenDeposited = tokenDepositedBn.toString();

    const ratio = (await vault.getRatioForOneEToken()).toString();
    let minOutput = await vault.getAmountOutputForExactInput(tokenDeposited);
    await usdcToken.connect(owner).transfer(addr1.address, tokenDeposited);
    await usdcToken.connect(owner).transfer(vault.address, tokenDeposited);
    await usdcToken.connect(addr1).approve(vault.address, tokenDeposited);
    await expect(vault.connect(addr1).provideLiquidity(tokenDeposited, minOutput))
      .to.be.revertedWith("Insufficient Output");
  });

  it('Should have staking balance still', async () => {
    expect(await usdcToken.balanceOf(addr1.address)).to.be.above(0);
  });

  it('Should withdraw all deposited', async () => {
    const eUsdcAddr = vault.address;
    const eUsdcToken = await ethers.getContractAt('ERC20EToken', eUsdcAddr);
    const eUsdcTokenBalance = await eUsdcToken.balanceOf(addr1.address);

    const balanceBeforeRemoveLiquidity = await usdcToken.balanceOf(addr1.address);
    const ratio = await vault.getRatioForOneEToken();
    expect(eUsdcTokenBalance.toString()).to.equal(
      (await vault.balanceOf(addr1.address)).toString()
    );
    await vault.connect(addr1).removeLiquidity(eUsdcTokenBalance);

    expect(await usdcToken.balanceOf(addr1.address)).to.equal(
      balanceBeforeRemoveLiquidity.add(eUsdcTokenBalance.mul(ratio).div(ratioDecimals))
    );
  });

  it('Precompute address of vault for a token', async () => {
    const precomputedAddress = await vaultFactory.precomputeAddress(daiToken.address);
    await vaultFactory.functions['createVault(address,uint256)'](
      daiToken.address,
      VAULT_MAX_CAPACITY_BN.toString(10)
    );

    expect(await vaultFactory.vaults(1)).to.equal(precomputedAddress);
    expect(await vaultFactory.vaultExists(precomputedAddress)).to.equal(true);
  });

  it('Should have two vaults', async () => {
    expect(await vaultFactory.countVaults()).to.equal(2);
  });

  it('Should have same decimals as staked token', async () => {
    expect(await vault.decimals()).to.equal(await usdcToken.decimals());
  });

  it('Should have the corresponding fee set', async () => {
    expect(await vault.calculateFeeForAmount(1000000)).to.equal(
      FLASH_FEE_PERCENTAGE_BN.multipliedBy(1000000).div(FLASH_FEE_AMOUNT_DIVIDER).toString()
    );
  });

  it('Should modify fee as moderator', async () => {
    await vault.setFee(FLASH_FEE_PERCENTAGE_BN.plus(10).toString(), FLASH_FEE_AMOUNT_DIVIDER);
    expect(await vault.calculateFeeForAmount(1000000)).to.equal(
      FLASH_FEE_PERCENTAGE_BN.plus(10)
        .multipliedBy(1000000)
        .div(FLASH_FEE_AMOUNT_DIVIDER)
        .toString()
    );
  });

  it('Should fail if percentage > 100%', async () => {
    await expect(vault.setFee(FLASH_FEE_PERCENTAGE_BN.plus(10).toString(), 1)).to.be.revertedWith(
      "FEE_EXCEED_100_PERCENT"
    );

  });

  it('Should modify treasury fee percentage as moderator', async () => {
    await vault.setTreasuryFeePercentage(25);

    expect(await vault.treasuryFeePercentage()).to.equal(25);
  });

  it('Should revert for settings fee if not moderator', async () => {
    expect(
      vault
        .connect(addr1)
        .setFee(FLASH_FEE_PERCENTAGE_BN.plus(10).toString(), FLASH_FEE_AMOUNT_DIVIDER)
    ).to.be.revertedWith(`Moderator: caller is not the moderator`);
  });

  //-------- FlashLoanProvider --------
  it('Should return 0 for max flash loan if token does not exists', async () => {
    // Use random address to test
    expect((await flashLoanProvider.maxFlashLoan(addr1.address)).toNumber()).to.equal(0);
  });

  it('Should be able to see flash fee', async () => {
    expect(
      (await flashLoanProvider.flashFee(usdcToken.address, 100000000)).toNumber()
    ).to.be.greaterThan(0);
  });

  it('Should revert if token token existing', async () => {
    // Use random address just for testing
    expect(flashLoanProvider.flashFee(addr1.address, 100)).to.be.revertedWith(
      'FLASH_LENDER_UNSUPPORTED_CURRENCY'
    );
  });

  it('Max flash loan should be bigger than 0', async () => {
    expect(
      (await flashLoanProvider.maxFlashLoan(usdcToken.address))
        .div(usdcTokenBnDecimals.toString())
        .toNumber()
    ).to.be.greaterThan(0);
  });

  it('Max flash loan function should return 0 if token does not exists', async () => {
    expect(
      (await flashLoanProvider.maxFlashLoan(daiToken.address))
        .div(usdcTokenBnDecimals.toString())
        .toNumber()
    ).to.equal(0);
  });

  it('Provide liquidity function should revert if the vault is paused', async () => {
    await vault.pauseVault();
    await expect(vault.provideLiquidity(DEPOSIT_VALUE, 0)).to.be.revertedWith('ONLY_NOT_PAUSED');
    await vault.unpauseVault();
  });

  it('Provide liquidity function should revert if the amount is 0', async () => {
    await vault.provideLiquidity(DEPOSIT_VALUE, 0);
    await expect(vault.provideLiquidity(0, 0)).to.be.revertedWith('CANNOT_STAKE_ZERO_TOKENS');
  });

  it('Initialize function should revert if the vault was already initialized', async () => {
    await expect(
      vault.initialize(TREASURY_ADDRESS, usdcToken.address, USDC_VAULT_MAX_CAPACITY_BN.toString(10))
    ).to.be.revertedWith('ONLY_NOT_INITIALIZED');
  });

  it('Pause vault function should revert if the vault is already paused', async () => {
    await vault.pauseVault();
    await expect(vault.pauseVault()).to.be.revertedWith('VAULT_ALREADY_PAUSED');
    await vault.unpauseVault();
  });

  it('Unpause vault function should revert if the vault is not paused', async () => {
    await expect(vault.unpauseVault()).to.be.revertedWith('VAULT_ALREADY_RESUMED');
  });

  it('Create Vault using public method - fail if not pay fee', async () => {
    await expect(
      vaultFactory.functions['createVault(address)'](usdtToken.address)
    ).to.be.revertedWith('ERC20: transfer amount exceeds allowance');
  });

  it('Create Vault using public method', async () => {
    await usdcToken
      .connect(owner)
      .transfer(owner.address, FLASH_LOAN_MINT_USDC_TOKEN_BN.toString());

    await usdcToken.approve(vaultFactory.address, ethers.constants.MaxUint256);
    expect(await vaultFactory.tokenToVault(usdtToken.address)).to.equal(
      ethers.constants.AddressZero
    );

    await vaultFactory.functions['createVault(address)'](usdtToken.address);
    expect(await vaultFactory.tokenToVault(usdtToken.address)).to.not.equal(
      ethers.constants.AddressZero
    );
  });

  it('Should withdraw funds', async () => {
    const ownerBalance = await usdcToken.balanceOf(owner.address);
    const vaultFactoryBalance = await usdcToken.balanceOf(vaultFactory.address);
    await vaultFactory.withdraw();
    const ownerBalanceAfter = await usdcToken.balanceOf(owner.address);

    expect(ownerBalanceAfter.toString()).to.equal(ownerBalance.add(vaultFactoryBalance).toString());
  });

  //-------- Moderable --------
  it('Should return moderator of vault', async () => {
    expect(await vault.moderator()).to.equal(owner.address);
  });

  it('Should transfer moderatorship', async () => {
    await vault.transferModeratorship(addr1.address);
    expect(await vault.moderator()).to.equal(addr1.address);
  });

  it('Should renounce moderatorship', async () => {
    await vault.connect(addr1).renounceModeratorship();
    expect(await vault.moderator()).to.equal(ethers.constants.AddressZero);
  });
});
