import { ethers } from 'hardhat';
import { provideVaultsLiquidity } from './utils';

async function main() {
  const tokensConfig = [
    {
      name: 'Tether',
      symbol: 'USDT',
      decimals: 6,
      address: '0xbE6C02195A28d163A1DF2e05B0596416d326b190',
    },
    {
      name: 'Ethereum',
      symbol: 'wETH',
      decimals: 18,
      address: '0x55A7154f49B046693A7C90e7BcF99CA8268Fa0BF',
    },
    {
      name: 'Polygon',
      symbol: 'MATIC',
      decimals: 18,
      address: '0x1343A33d5510e95B87166433BCDDd5DbEe8B4D8A',
    },
  ];
  let tokens = [];
  let vaults = [];

  let vaultsConfig = [
    {
      address: '0x65e27aD9593338291d056cc1Bf2ab0C47609e02C',
    },
    {
      address: '0x49B28C6D3FE1C8c69d8C1e358a3d5CaA5CBbABA6',
    },
    {
      address: '0xEe80f0fCEdFab78a631223dD68bcf3992e38C317',
    },
  ];

  for (let token of tokensConfig) {
    tokens.push(await ethers.getContractAt('ERC20TokenMock', token.address));
  }

  for (let i = 0; i < vaultsConfig.length; i++) {
    vaults.push(await ethers.getContractAt('Vault', vaultsConfig[i].address));
  }
  return provideVaultsLiquidity(tokens, vaults);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
