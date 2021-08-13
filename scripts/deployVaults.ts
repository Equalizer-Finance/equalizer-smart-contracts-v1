import { ethers } from 'hardhat';
import VaultFactoryArtifact from '../artifacts/contracts/VaultFactory.sol/VaultFactory.json';
import { getTokenBnDecimals, getVaultMaxCapacity } from './utils';
import BigNumber from 'bignumber.js';

async function main() {
  // const tokensConfig = [
  //   {
  //     address: '0xbE6C02195A28d163A1DF2e05B0596416d326b190',
  //     decimals: 6,
  //     name: 'Tether',
  //     symbol: 'USDT',
  //   },
  //   {
  //     address: '0x55A7154f49B046693A7C90e7BcF99CA8268Fa0BF',
  //     decimals: 18,
  //     symbol: 'wETH',
  //     name: 'Ethereum',
  //   },
  //   {
  //     address: '0x1343A33d5510e95B87166433BCDDd5DbEe8B4D8A',
  //     decimals: 18,
  //     name: 'Polygon',
  //     symbol: 'MATIC',
  //   },
  //   {
  //     address: '0x29ae2B73467672F1b6E8634e21E89F7678eEc9e5',
  //     decimals: 18,
  //     name: 'Uniswap',
  //     symbol: 'UNI',
  //   },
  //   {
  //     address: '0xfC2Cca7326ab6bcF33ccF1911e1CdC37B2bbE21B',
  //     decimals: 18,
  //     name: 'Chainlink',
  //     symbol: 'LINK',
  //   },
  //   {
  //     address: '0x2c4CeD67fA1bb3612717484F016a5831FB20e690',
  //     decimals: 6,
  //     name: 'USD Coin',
  //     symbol: 'USDC',
  //   },
  //   {
  //     address: '0xF474A6482931bef44D161148A0905555b153FD18',
  //     decimals: 8,
  //     name: 'Wrapped BTC',
  //     symbol: 'WBTC',
  //   },
  //   {
  //     address: '0x2b37DB2f9bDE3993Aba2a3Dfb18826446F3feD65',
  //     decimals: 18,
  //     name: 'Aave',
  //     symbol: 'AAVE',
  //   },
  //   {
  //     address: '0x1C99E66139836D24F97A57A5Cffcaa7668e05Dd5',
  //     decimals: 18,
  //     name: 'Maker',
  //     symbol: 'MKR',
  //   },
  //   {
  //     address: '0xEA8218bbE0D4A48AF14e91dff0E83100f236dd04',
  //     decimals: 18,
  //     name: 'Dai Stablecoin',
  //     symbol: 'DAI',
  //   },
  //   {
  //     address: '0xfe3eBaCE14DFE231e17c0A3B36A6c7Dd3B0a8eD2',
  //     decimals: 18,
  //     name: 'Synthetix Network Token',
  //     symbol: 'SNX',
  //   },
  //   {
  //     address: '0xBA74fd634725E3d275E508f41D5981220eaE13c5',
  //     decimals: 18,
  //     name: 'Compound',
  //     symbol: 'COMP',
  //   },
  //   {
  //     address: '0x02709F261A0A77C1E04455aBceC38A1364435855',
  //     decimals: 18,
  //     name: 'SushiToken',
  //     symbol: 'SUSHI',
  //   },
  //   {
  //     address: '0x65608b4fF7Ed8E45DBc0dc4c62C11Bb8444046a1',
  //     decimals: 18,
  //     name: 'Basic Attention Token',
  //     symbol: 'BAT',
  //   },
  //   {
  //     address: '0x1437436A82CebA2d2c0324067d0ed3445A9Efc41',
  //     decimals: 18,
  //     name: '0x',
  //     symbol: 'ZRX',
  //   },
  //   {
  //     address: '0x0e041a97C2c7C37aDa54B9Eea6D3B83ed7Cb4419',
  //     decimals: 18,
  //     name: 'Year.finance',
  //     symbol: 'YFI',
  //   },
  //   {
  //     symbol: 'BNT',
  //     name: 'Bancor',
  //     decimals: 18,
  //     address: '0xAA6E82177021011B29c285d8021f7344Dd7887A1',
  //   },
  //   {
  //     symbol: 'CRV',
  //     name: 'Curve DAO Token',
  //     decimals: 18,
  //     address: '0xbf202177CbE7ABb34cE51C7e6B06Be83b81DBA10',
  //   },
  //   {
  //     symbol: '1INCH',
  //     name: '1inch',
  //     decimals: 18,
  //     address: '0x2bE054308bd34588fC47B668Ed44CDbdd79b59fC',
  //   },
  //   {
  //     name: 'Equalizer',
  //     symbol: 'EQZ',
  //     decimals: 18,
  //     address: '0x01f7feeb77ae5e04d9606c209a7faff2187cd5c1',
  //   },
  // ];

  const tokensProd = [
    {
      symbol: 'Link',
      address: '0x514910771af9ca656af840dff83e8264ecf986ca',
      decimals: 18,
      maxCapacity: 13000,
    },
    {
      symbol: 'usdt',
      address: '0xdac17f958d2ee523a2206206994597c13d831ec7',
      maxCapacity: 250000,
      decimals: 6,
    },
    {
      symbol: 'dai',
      address: '0x6b175474e89094c44da98b954eedeac495271d0f',
      maxCapacity: 250000,
      decimals: 18,
    },
    {
      symbol: 'usdc',
      address: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
      maxCapacity: 250000,
      decimals: 6,
    },
    {
      symbol: 'weth',
      address: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
      decimals: 18,
      maxCapacity: 170,
    },
    {
      symbol: 'wbtc',
      address: '0x2260fac5e5542a773aa44fbcfedf7c193bc2c599',
      decimals: 8,
      maxCapacity: 8,
    },
    {
      symbol: 'eqz',
      address: '0x1da87b114f35e1dc91f72bf57fc07a768ad40bb0',
      decimals: 18,
      maxCapacity: 250000,
    },
    {
      symbol: 'matic',
      address: '0x7d1afa7b718fb893db30a3abc0cfc608aacfebb0',
      decimals: 18,
      maxCapacity: 125000,
    },
    {
      symbol: 'aave',
      address: '0x7fc66500c84a76ad7e9c93437bfc5ac33e2ddae9',
      decimals: 18,
      maxCapacity: 400,
    },
    {
      symbol: 'uni',
      address: '0x1f9840a85d5af5bf1d1762f925bdaddc4201f984',
      decimals: 18,
      maxCapacity: 6000,
    },
  ];

  let vaultsCreated = 0;

  const [owner] = await ethers.getSigners();

  const vaultFactory = new ethers.Contract(
    '0x79323464E09800607E676a03b987330cDf04874B',
    VaultFactoryArtifact.abi,
    owner
  );

  for (let i = 0; i < tokensProd.length; i++) {
    const tokenBnDecimals = getTokenBnDecimals(tokensProd[i].decimals);
    const maxCapacity = new BigNumber(tokensProd[i].maxCapacity).multipliedBy(tokenBnDecimals);

    await (
      await vaultFactory.functions['createVault(address,uint256)'](
        tokensProd[i].address,
        maxCapacity.toString(10)
      )
    ).wait(1);
    vaultsCreated++;
  }

  console.log(`Vaults deployed:`, vaultsCreated);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
