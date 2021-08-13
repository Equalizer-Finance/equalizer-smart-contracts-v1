import BigNumber from 'bignumber.js';
import { ethers } from 'hardhat';

function randomIntFromInterval(min, max) {
  // min and max included
  return Math.floor(Math.random() * (max - min + 1) + min);
}

async function main() {
  const flashBorrower = await ethers.getContractAt(
    'FlashBorrowerMock',
    '0xBcA8520B06Eb5eA6e4Adbc47DC68f06985976D44'
  );
  const tokens = [
    {
      address: '0xbE6C02195A28d163A1DF2e05B0596416d326b190',
      decimals: 6,
    },
    {
      address: '0x55A7154f49B046693A7C90e7BcF99CA8268Fa0BF',
      decimals: 18,
    },
    {
      address: '0x1343A33d5510e95B87166433BCDDd5DbEe8B4D8A',
      decimals: 18,
    },
    {
      symbol: 'BNT',
      name: 'Bancor',
      decimals: 18,
      address: '0xAA6E82177021011B29c285d8021f7344Dd7887A1',
    },
    {
      symbol: 'CRV',
      name: 'Curve DAO Token',
      decimals: 18,
      address: '0xbf202177CbE7ABb34cE51C7e6B06Be83b81DBA10',
    },
    {
      symbol: '1INCH',
      name: '1inch',
      decimals: 18,
      address: '0x2bE054308bd34588fC47B668Ed44CDbdd79b59fC',
    },
    {
      name: 'Equalizer',
      symbol: 'EQZ',
      decimals: 18,
      address: '0x01f7feeb77ae5e04d9606c209a7faff2187cd5c1',
    },
  ];

  for (let token of tokens) {
    const nr = randomIntFromInterval(30, 100);
    console.log(nr);
    const decimals = new BigNumber(10).pow(token.decimals);

    const amount = new BigNumber(nr).multipliedBy(decimals).toString(10);
    const tokenMock = await ethers.getContractAt('ERC20TokenMock', token.address);
    await (await tokenMock.transfer('0xBcA8520B06Eb5eA6e4Adbc47DC68f06985976D44', amount)).wait(1);
    const response = await flashBorrower.flashBorrow(token.address, amount, {
      gasLimit: 1000000,
    });
    await response.wait(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
