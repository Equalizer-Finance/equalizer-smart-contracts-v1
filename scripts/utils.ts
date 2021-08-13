import BigNumber from 'bignumber.js';
import {
  ERC20TokenMock,
  FlashBorrowerMock,
  FlashLoanProvider,
  Vault,
  VaultFactory,
} from '../typechain';
import { ethers, waffle } from 'hardhat';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
const { deployContract } = waffle;

import ERC20TokenMockArtifact from '../artifacts/contracts/mock/ERC20TokenMock.sol/ERC20TokenMock.json';
import FlashBorrowerArtifact from '../artifacts/contracts/mock/FlashBorrowerMock.sol/FlashBorrowerMock.json';
import FlashLoanProviderArtifact from '../artifacts/contracts/FlashLoanProvider.sol/FlashLoanProvider.json';
import VaultFactoryArtifact from '../artifacts/contracts/VaultFactory.sol/VaultFactory.json';

export function getTokenBnDecimals(nrOfDecimals: number) {
  return new BigNumber(10).pow(nrOfDecimals);
}

export function getVaultMaxCapacity(nrOfDecimals: number) {
  const tokenBnDecimals = getTokenBnDecimals(nrOfDecimals);
  return new BigNumber(100000).multipliedBy(tokenBnDecimals);
}

export async function provideVaultsLiquidity(tokens: ERC20TokenMock[], vaults: Vault[]) {
  console.log('\n');
  console.log('Provide liquidity:');
  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];
    const tokenDecimals = await token.decimals();
    const tokenBnDecimals = getTokenBnDecimals(tokenDecimals);
    const vault = vaults[i];
    const vaultName = await vault.name();
    const deposit = new BigNumber(100).multipliedBy(tokenBnDecimals).toString();

    console.log('\n');
    console.log(`Vault ${vaultName}:`);
    console.log(
      'Initial balance:',
      (await token.balanceOf(vault.address)).div(tokenBnDecimals.toString()).toNumber()
    );

    await (await token.approve(vault.address, deposit)).wait(1);
    await (await vault.provideLiquidity(deposit)).wait(1);

    console.log(
      'After balance:',
      (await token.balanceOf(vault.address)).div(tokenBnDecimals.toString()).toNumber()
    );
  }
}

export async function createTokens(defaultTokenConfig?) {
  const tokensConfig = defaultTokenConfig || [
    {
      name: 'Tether',
      symbol: 'USDT',
      decimals: 6,
    },
    {
      name: 'Ethereum',
      symbol: 'wETH',
      decimals: 18,
    },
    {
      name: 'Polygon',
      symbol: 'MATIC',
      decimals: 18,
    },
  ];
  const tokens = [];
  const [owner] = await ethers.getSigners();

  for (const { name, symbol, decimals } of tokensConfig) {
    const token = (await deployContract(<SignerWithAddress>owner, ERC20TokenMockArtifact, [
      name,
      symbol,
      decimals,
    ])) as ERC20TokenMock;

    await token.deployed();

    console.log(`Token ${name} deployed to: ${token.address}`);

    tokens.push(token);
  }

  return tokens;
}

export async function createFlashLoanProvider(vaultFactoryAddress: string) {
  const [owner] = await ethers.getSigners();

  const flashLoanProvider = (await deployContract(
    <SignerWithAddress>owner,
    FlashLoanProviderArtifact,
    [vaultFactoryAddress]
  )) as FlashLoanProvider;

  console.log('Flash Loan Provider deployed to:', flashLoanProvider.address);

  return flashLoanProvider;
}

export async function createEqzToken() {
  const [owner] = await ethers.getSigners();

  const eqzToken = (await deployContract(<SignerWithAddress>owner, ERC20TokenMockArtifact, [
    'EQZ',
    'eqz',
    18,
  ])) as ERC20TokenMock;

  await eqzToken.deployed();

  console.log('EQZ Token deployed to:', eqzToken.address);

  return eqzToken;
}

export async function createVaultFactory() {
  const [owner] = await ethers.getSigners();

  const vaultFactory = (await deployContract(
    <SignerWithAddress>owner,
    VaultFactoryArtifact,
    []
  )) as VaultFactory;

  console.log('Vault Factory deployed to:', vaultFactory.address);

  return vaultFactory;
}

export async function createFlashBorrower(
  flashLoanProviderAddress: string,
  vaultFactoryAddress: string
) {
  const [owner] = await ethers.getSigners();

  const flashBorrower = (await deployContract(<SignerWithAddress>owner, FlashBorrowerArtifact, [
    flashLoanProviderAddress,
    vaultFactoryAddress,
  ])) as FlashBorrowerMock;

  await flashBorrower.deployed();

  console.log('Flash Borrower deployed to:', flashBorrower.address);

  return flashBorrower;
}
