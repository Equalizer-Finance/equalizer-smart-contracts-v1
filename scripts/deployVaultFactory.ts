import { createVaultFactory } from './utils';

async function main() {
  await createVaultFactory();
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
