// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
import { ethers } from 'hardhat';

import { Vault } from '../typechain';
import {
  createEqzToken,
  createFlashLoanProvider,
  createTokens,
  createVaultFactory,
  getVaultMaxCapacity,
  provideVaultsLiquidity,
} from './utils';

async function main() {
  // Hardhat always runs the compile task when running scripts with its command
  // line interface.
  //
  // If this script is run directly using `node` you may want to call compile
  // manually to make sure everything is compiled
  // await hre.run('compile');

  const eqzToken = await createEqzToken();
  const vaultsCreated = [];
  const vaultsSkipped = [];
  const tokensVaultsCreated = [];

  console.log('\n');

  const vaultFactory = await createVaultFactory();
  const flashLoanProvider = await createFlashLoanProvider(vaultFactory.address);
  await vaultFactory.initialize(flashLoanProvider.address, eqzToken.address);
  // await createFlashBorrower(flashLoanProvider.address, vaultFactory.address);

  const tokens = await createTokens();

  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];

    // check if the vault exists
    const precomputeAddress = await vaultFactory.precomputeAddress(token.address);
    const vaultExists = await vaultFactory.vaultExists(precomputeAddress);
    if (vaultExists) {
      const existingVault = await ethers.getContractAt('Vault', precomputeAddress);
      const vaultIsInitialized = await existingVault.isInitialized();
      if (vaultIsInitialized) {
        vaultsSkipped.push(existingVault);
        continue;
      }
    }

    const tokenDecimals = await token.decimals();

    // create new vault
    await vaultFactory.functions['createVault(address,uint256)'](
      token.address,
      getVaultMaxCapacity(tokenDecimals).toString(10)
    );

    const vault = await ethers.getContractAt('Vault', await vaultFactory.vaults(i));

    vaultsCreated.push(vault);
    tokensVaultsCreated.push(token);
  }

  // display created vaults
  console.log('\n');
  console.log(`Vaults deployed:`, vaultsCreated.length);
  for (const vault of vaultsCreated) {
    const vaultName = await vault.name();
    console.log(`${vaultName} deployed to: ${vault.address}`);
  }

  // display skipped vaults
  console.log('\n');
  console.log(`Vaults skipped:`, vaultsSkipped.length);
  for (const vault of vaultsSkipped) {
    const vaultName = await vault.name();
    console.log(vaultName);
  }

  // @TODO: remove before deploy to mainnet
  await provideVaultsLiquidity(tokensVaultsCreated, vaultsCreated);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
