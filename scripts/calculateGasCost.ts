// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
import { ethers, waffle } from 'hardhat';
import BigNumber from 'bignumber.js';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';

import { ERC20TokenMock, Vault } from '../typechain';
import ERC20TokenMockArtifact from '../artifacts/contracts/mock/ERC20TokenMock.sol/ERC20TokenMock.json';
import {
  createEqzToken,
  createFlashBorrower,
  createFlashLoanProvider,
  createVaultFactory,
} from './utils';

const { deployContract } = waffle;

async function createToken() {
  const [owner] = await ethers.getSigners();

  const token = (await deployContract(<SignerWithAddress>owner, ERC20TokenMockArtifact, [
    'Tether',
    'USDT',
    6,
  ])) as ERC20TokenMock;

  await token.deployed();

  console.log(`Token Tether deployed to: ${token.address}`);

  return token;
}

function getTokenBnDecimals(nrOfDecimals: number) {
  return 10 ** nrOfDecimals;
}

function getVaultMaxCapacity(nrOfDecimals: number) {
  const tokenBnDecimals = getTokenBnDecimals(nrOfDecimals);
  return new BigNumber(100000).multipliedBy(tokenBnDecimals);
}

async function provideVaultsLiquidity(token: ERC20TokenMock, vault: Vault) {
  const [owner] = await ethers.getSigners();

  const tokenDecimals = await token.decimals();
  const tokenBnDecimals = getTokenBnDecimals(tokenDecimals);
  const vaultName = await vault.name();
  const deposit = new BigNumber(10000).multipliedBy(tokenBnDecimals).toString();

  console.log('\n');
  console.log(`Provide liquidity for Vault ${vaultName}:`);
  console.log(
    'Initial balance Vault:',
    (await token.balanceOf(vault.address)).div(tokenBnDecimals.toString()).toNumber()
  );
  console.log(
    'Initial balance owner:',
    (await token.balanceOf(owner.address)).div(tokenBnDecimals.toString()).toNumber()
  );

  await token.approve(vault.address, deposit);
  await vault.provideLiquidity(deposit);

  console.log(
    'After balance Vault:',
    (await token.balanceOf(vault.address)).div(tokenBnDecimals.toString()).toNumber()
  );
  console.log(
    'After balance owner:',
    (await token.balanceOf(owner.address)).div(tokenBnDecimals.toString()).toNumber()
  );
}

async function createVault() {
  // Hardhat always runs the compile task when running scripts with its command
  // line interface.
  //
  // If this script is run directly using `node` you may want to call compile
  // manually to make sure everything is compiled
  // await hre.run('compile');

  // Constants
  const TREASURY_ADDRESS = '0x4D4049D43CeF24dEe359F9e3091dB83b0bE4Bc1d';

  const vaultFactory = await createVaultFactory();
  const eqzToken = await createEqzToken();

  const flashLoanProvider = await createFlashLoanProvider(vaultFactory.address);
  await vaultFactory.initialize(flashLoanProvider.address, eqzToken.address);

  const flashBorrower = await createFlashBorrower(flashLoanProvider.address, vaultFactory.address);
  const token = await createToken();

  const tokenDecimals = await token.decimals();

  // create new vault
  await vaultFactory.functions['createVault(address,uint256)'](
    token.address,
    getVaultMaxCapacity(tokenDecimals).toString(10)
  );

  const vault = await ethers.getContractAt('Vault', await vaultFactory.vaults(0));
  const vaultName = await vault.name();

  console.log('\n');
  console.log(`Vault ${vaultName} deployed to: ${vault.address}`);

  await provideVaultsLiquidity(token, vault as Vault);

  return {
    flashBorrower,
    vault,
    token,
  };
}

async function main() {
  // Hardhat always runs the compile task when running scripts with its command
  // line interface.
  //
  // If this script is run directly using `node` you may want to call compile
  // manually to make sure everything is compiled
  // await hre.run('compile');

  const { flashBorrower, token } = await createVault();

  const tokenDecimals = await token.decimals();
  const tokenBnDecimals = getTokenBnDecimals(tokenDecimals);
  const amount = new BigNumber(10).multipliedBy(tokenBnDecimals).toNumber();

  // transfer amount
  await token.transfer(flashBorrower.address, amount);

  // execute flash loan
  const response = await flashBorrower.flashBorrow(token.address, amount);
  const receipt = await response.wait(1);

  // display results
  console.log('\n');
  console.log('Gas price:', response.gasPrice.toNumber() / 10 ** 9);
  console.log('Gas used:', receipt.gasUsed.toNumber());
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
