import { ethers } from 'hardhat';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import UtilityArtifact from '../artifacts/contracts/utilities/Utility.sol/Utility.json';
import { Utility } from '../typechain';
import { deployContract } from 'ethereum-waffle';

async function main() {
  const [owner] = await ethers.getSigners();

  const utility = (await deployContract(<SignerWithAddress>owner, UtilityArtifact, [])) as Utility;

  await utility.deployed();

  console.log('Utility deployed to:', utility.address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
