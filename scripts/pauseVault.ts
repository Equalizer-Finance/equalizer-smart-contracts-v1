import { ethers } from 'hardhat';

async function main() {
  const vault = {
    name: 'Tether',
    address: '0xCfB9243003EAB8676634e891162a6f7c74855E8f',
  };

  console.log('Vault: ', vault.name);
  const existingVault = await ethers.getContractAt('Vault', vault.address);
  await existingVault.unpauseVault();
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
