import { HardhatUserConfig, task } from 'hardhat/config';
import '@nomiclabs/hardhat-waffle';
import 'hardhat-typechain';
import 'hardhat-gas-reporter';
import '@nomiclabs/hardhat-solhint';
import 'solidity-coverage';
import '@nomiclabs/hardhat-etherscan';

require('dotenv').config();

// import {listVaults} from './scripts/utils';

// This is a sample Hardhat task. To learn how to create your own go to
// https://hardhat.org/guides/create-task.html
task('accounts', 'Prints the list of accounts', async (args, hre) => {
  const accounts = await hre.ethers.getSigners();

  for (const account of accounts) {
    console.log(await account.address);
  }
});

task('listvaults', 'Prints the list of vaults')
  .addOptionalParam('address', 'Vault factory address')
  .setAction(async ({ address }, hre) => {
    const [owner] = await hre.ethers.getSigners();

    const VaultFactoryArtifact = require('./artifacts/contracts/VaultFactory.sol/VaultFactory.json');
    const vaultFactory = new hre.ethers.Contract(address, VaultFactoryArtifact.abi, owner);

    const totalNrOfVaults = await vaultFactory.countVaults();

    console.log('Nr of vaults:', totalNrOfVaults.toNumber());

    for (let i = 0; i < totalNrOfVaults; i++) {
      const vault = await hre.ethers.getContractAt('Vault', await vaultFactory.vaults(i));
      console.log('Vault name: ', await vault.name(), ' address: ', vault.address);
    }
  });

// You need to export an object to set up your config
// Go to https://hardhat.org/config/ to learn more

const config: HardhatUserConfig = {
  defaultNetwork: 'hardhat',

  solidity: {
    version: '0.8.4',
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  etherscan: {
    apiKey: process.env.ETHERSCAN_API_KEY,
  },
  gasReporter: {
    currency: 'USD',
    gasPrice: 21,
  },
  networks: {
    hardhat: {},
    localhost: {
      url: 'http://localhost:8545',
    },
    coverage: {
      url: 'http://127.0.0.1:8555', // Coverage launches its own ganache-cli client
    },
    rinkeby: {
      url: process.env.RPC_URL,
      accounts: [process.env.WALLET_PRIV_KEY],
    },
    mainnet: {
      url: process.env.RPC_URL,
      accounts: [process.env.WALLET_PRIV_KEY],
    },
  },
};

export default config;
