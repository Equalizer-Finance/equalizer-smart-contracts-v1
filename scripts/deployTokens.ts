import { createTokens } from './utils';

async function main() {
  const tokensConfig = [
    {
      symbol: 'BNT',
      name: 'Bancor',
      decimals: 18,
    },
    {
      symbol: 'CRV',
      name: 'Curve DAO Token',
      decimals: 18,
    },
    {
      symbol: '1INCH',
      name: '1inch',
      decimals: 18,
    },
    {
      symbol: '1INCH',
      name: '1inch',
      decimals: 18,
    },
  ];

  await createTokens(tokensConfig);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
