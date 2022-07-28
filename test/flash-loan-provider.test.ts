import { expect } from 'chai';
import { ethers, waffle } from 'hardhat';

const { deployContract } = waffle;
import { Wallet } from 'ethers';
import BigNumber from 'bignumber.js';

import {
  VaultFactory,
  FlashLoanProvider,
  ERC20TokenMock,
  FlashBorrowerMock,
  FlashBorrowerMockWithExploit
} from '../typechain';

import VaultFactoryArtifact from '../artifacts/contracts/VaultFactory.sol/VaultFactory.json';
import FlashLoanProviderArtifact from '../artifacts/contracts/FlashLoanProvider.sol/FlashLoanProvider.json';
import ERC20TokenMockArtifact from '../artifacts/contracts/mock/ERC20TokenMock.sol/ERC20TokenMock.json';
import FlashBorrowerMockArtifact from '../artifacts/contracts/mock/FlashBorrowerMock.sol/FlashBorrowerMock.json';

describe('FlashLoanProvider', async () => {
  let flashLoanProvider = null;
  let vaultFactory = null;
  let owner, addr1;
  let usdcToken = null;
  let vault = null;

  const USDC_TOKEN_DECIMALS = 6;
  const usdcTokenBnDecimals = new BigNumber(10).pow(USDC_TOKEN_DECIMALS);
  const VAULT_MAX_CAPACITY_BN = new BigNumber(100000).multipliedBy(usdcTokenBnDecimals);
  const DEPOSIT_VALUE = new BigNumber(50).multipliedBy(usdcTokenBnDecimals).toString();

  let flashBorrower = null;
  let flashBorrowerExploiter = null;

  before(async () => {
    [owner, addr1] = await ethers.getSigners();
    vaultFactory = (await deployContract(<Wallet>owner, VaultFactoryArtifact, [])) as VaultFactory;

    usdcToken = (await deployContract(<Wallet>owner, ERC20TokenMockArtifact, [
      'USDC',
      'usdc',
      6,
    ])) as ERC20TokenMock;

    await usdcToken.deployed();

    flashLoanProvider = (await deployContract(<Wallet>owner, FlashLoanProviderArtifact, [
      vaultFactory.address,
    ])) as FlashLoanProvider;

    flashBorrower = (await deployContract(<Wallet>owner, FlashBorrowerMockArtifact, [
      flashLoanProvider.address,
      vaultFactory.address,
    ])) as FlashBorrowerMock;

    flashBorrowerExploiter = (await (await ethers.getContractFactory('FlashBorrowerMockWithExploit')).deploy(flashLoanProvider.address,
      vaultFactory.address)) as FlashBorrowerMockWithExploit;

    await vaultFactory.initialize(flashLoanProvider.address, usdcToken.address);
    await vaultFactory.functions['createVault(address,uint256)'](
      usdcToken.address,
      VAULT_MAX_CAPACITY_BN.toString(10)
    );

    vault = await ethers.getContractAt('Vault', await vaultFactory.vaults(0));
  });

  it('Should revert if fee does not exist', async () => {
    // Use random address
    expect(flashLoanProvider.flashFee(vaultFactory.address, 100)).to.be.revertedWith(
      'FLASH_LENDER_UNSUPPORTED_CURRENCY'
    );
  });

  it('Should print fee if token exists', async () => {
    expect(
      (await flashLoanProvider.flashFee(usdcToken.address, 100000000)).toNumber()
    ).to.be.greaterThan(0);
  });

  it('Should revert flash loan if token does not exists', async () => {
    // Use random address
    expect(
      flashLoanProvider.flashLoan(
        flashBorrower.address,
        vaultFactory.address,
        100,
        ethers.utils.randomBytes(3)
      )
    ).to.be.revertedWith('FLASH_LENDER_UNSUPPORTED_CURRENCY');
  });

  it('Should revert if amount to small', async () => {
    expect(
      flashLoanProvider.flashLoan(
        flashBorrower.address,
        usdcToken.address,
        0,
        ethers.utils.randomBytes(3)
      )
    ).to.be.revertedWith('FLASH_VALUE_IS_LESS_THAN_MIN_AMOUNT');
  });

  it('Should revert if amount bigger than balance', async () => {
    expect(
      flashLoanProvider.flashLoan(
        flashBorrower.address,
        usdcToken.address,
        1000000000000,
        ethers.utils.randomBytes(3)
      )
    ).to.be.revertedWith('AMOUNT_BIGGER_THAN_BALANCE');
  });

  it('Should revert if amount to small', async () => {
    await usdcToken.approve(vault.address, ethers.constants.MaxUint256);
    await vault.provideLiquidity(DEPOSIT_VALUE, 0);

    expect(
      flashLoanProvider.flashLoan(
        ethers.constants.AddressZero,
        usdcToken.address,
        100,
        ethers.utils.randomBytes(3)
      )
    ).to.be.revertedWith('ERC20: transfer to the zero address');
  });

  it('Should revert if receiver does not implement IERC3156FlashBorrowerMock', async () => {
    //Use random address for receiver
    expect(
      flashLoanProvider.flashLoan(
        usdcToken.address,
        usdcToken.address,
        100,
        ethers.utils.randomBytes(3)
      )
    ).to.be.revertedWith(
      "Transaction reverted: function selector was not recognized and there's no fallback function"
    );
  });

  it ('should fail to exploit the vault', async () => {
    await usdcToken.approve(vault.address, ethers.constants.MaxUint256);
    await vault.provideLiquidity(DEPOSIT_VALUE, 0);
    let maxLoan = await flashLoanProvider.maxFlashLoan(usdcToken.address);
    let flAmount = maxLoan * 9 / 10;
    await usdcToken.transfer(flashBorrowerExploiter.address, maxLoan);



    await expect(flashBorrowerExploiter.flashLoan(
      usdcToken.address,
      flAmount,
      ethers.utils.randomBytes(3)
    )).to.be.revertedWith('ONLY_NOT_PAUSED');
  })


});
