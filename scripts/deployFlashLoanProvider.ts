import { createFlashLoanProvider } from './utils';

async function main() {
  const vaultFactoryAddress = '0x79323464E09800607E676a03b987330cDf04874B';
  await createFlashLoanProvider(vaultFactoryAddress);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
