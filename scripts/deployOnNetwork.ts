import { createVaultFactory } from './utils';
import {VaultFactory, VaultFactory__factory} from "../typechain";
import {ethers} from "hardhat";
const hre = require("hardhat");
require('dotenv').config();


async function main() {
  const treasuryAddress = process.env.TREASURY_ADDRESS || '0x0';
  const factoryOwner = process.env.FACTORY_OWNER || '0x0';
  let tokenToPayInFee = process.env.TOKEN_TO_PAY_FEE || '0x0';
  let vaultStakedTokens = process.env.VAULT_STAKED_TOKEN.split(',') || [];
  let vaultStakedTokensSize = process.env.VAULT_SIZE.split(',') || [];
  if ((await ethers.provider.getNetwork()).chainId == 31337) { // hardhat network
    let erc20Factory = await ethers.getContractFactory('ERC20TokenMock');
    tokenToPayInFee = (await erc20Factory.deploy('EQZ', 'EQZ', 18)).address;
    for (const vaultStakedTokenIndex in vaultStakedTokens) {
      vaultStakedTokens[vaultStakedTokenIndex] = (await erc20Factory.deploy(`token${vaultStakedTokenIndex}`, "TEST", 18)).address;
    }
  }

  // deploy vaultFactory
  const vaultFactoryFactory = await ethers.getContractFactory('VaultFactory')
  console.log('deploying vaultFactory')
  const vaultFactory = (await vaultFactoryFactory.deploy()) as VaultFactory;
  await vaultFactory.deployed();
  // verify on etherscan
  // try {
  //   await hre.run("verify:verify", {
  //     address: vaultFactory.address
  //   })
  // } catch (e) {
  //   //already verified
  // }
  console.log(`Vault Factory deployed at: ${vaultFactory.address}`);

  // init vaultFactory with treasury Address
  await (await vaultFactory.setTreasuryAddress(treasuryAddress)).wait(1);
  console.log(`Vault factory init at ${vaultFactory.address} with treasuryAddress ${treasuryAddress}`);

  // deploy flashLoan Provider
  console.log(`deploy FL Provider`);
  const flProviderFactory = await ethers.getContractFactory('FlashLoanProvider');
  const flProvider = await flProviderFactory.deploy(vaultFactory.address);
  await flProvider.deployed();
  console.log(`FL Provider deployed at: ${flProvider.address}`)
  // verify
  // try {
  //   await hre.run("verify:verify", {
  //     address: flProvider.address,
  //     constructorArguments: [
  //       vaultFactory.address
  //     ]
  //   });
  // } catch (e) {
  //   console.log(`already verified or some other error`)
  // }

  // init vaultFactory
  console.log(`init vaultFactory with fl provider address: ${flProvider.address} and token: ${tokenToPayInFee}`)

  await(await vaultFactory.initialize(flProvider.address, tokenToPayInFee)).wait(1);

  // deploy Vault

  console.log(`deploy vaults...`);
  const vaults = [];
  for (const index in vaultStakedTokens) {
    console.log(`deploy vault for: ${vaultStakedTokens[index]}`);
    await(await vaultFactory["createVault(address,uint256)"](vaultStakedTokens[index], vaultStakedTokensSize[index])).wait(1);
    // get vault:

    const vault = await hre.ethers.getContractAt('Vault', await vaultFactory.vaults(0), (await ethers.getSigners())[0])

    await(await vault.transferModeratorship(factoryOwner)).wait(1);
    vaults.push(vault.address);
  }





  // change moderatorship

  await(await vaultFactory.transferModeratorship(factoryOwner)).wait(1);


  console.log(`
  deployed:
  vaultFactory: ${vaultFactory.address},
  flProvider: ${flProvider.address},
  vaults: ${vaults.join(',')}
  `)

}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
