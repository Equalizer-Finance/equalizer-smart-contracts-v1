import { ethers } from 'hardhat';
import VaultFactoryArtifact from '../artifacts/contracts/VaultFactory.sol/VaultFactory.json';

async function main() {
  const [owner] = await ethers.getSigners();
  const flashLoanProviderAddress = '0x968f5aecD063A227EBF03827d0A13d98cb607742';
  const feeToken = '0x1da87b114f35e1dc91f72bf57fc07a768ad40bb0';
  const vaultFactory = new ethers.Contract(
    '0x79323464E09800607E676a03b987330cDf04874B',
    VaultFactoryArtifact.abi,
    owner
  );
  await vaultFactory.initialize(flashLoanProviderAddress, feeToken);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
