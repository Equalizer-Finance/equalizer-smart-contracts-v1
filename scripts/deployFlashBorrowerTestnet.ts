import { createFlashBorrower } from './utils';

async function main() {
  const flashLoanProviderAddress = '0x3649380F6ce217Ae1d76FCc4092d3c84EB45f7d1';
  const vaultFactoryAddress = '0x2148709A9cdBC744B1432a4E729261805c9a3946';

  await createFlashBorrower(flashLoanProviderAddress, vaultFactoryAddress);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
