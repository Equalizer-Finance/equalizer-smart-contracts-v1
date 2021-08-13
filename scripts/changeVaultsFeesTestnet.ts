import {ethers} from 'hardhat';

async function main() {
    const vaults = [
        {
            name: 'Tether',
            address: '0xCfB9243003EAB8676634e891162a6f7c74855E8f',
        },
        {
            name: 'Ethereum',
            address: '0x76F4C55287F31a6A7b44A5D2d56832eC4F407B78',
        },
        {
            name: 'Polygon',
            address: '0x41AB3Ef155786Fbac4531EA22A1F74b53484f60D',
        },
        {
            name: 'Uniswap',
            address: '0x1Fa98da6A25Cd424179927d78f850e154d2d8708',
        },
        {
            name: 'Chainlink',
            address: '0x221a4E39eEc17880E4856b2706d2F6e5e9d89875',
        },
        {
            name: 'USD Coin',
            address: '0xe24BF6627c7aaD8B897857598DCe615c6788878B',
        },
        {
            name: 'Wrapped Bitcoin',
            address: '0x7380F265AE4786929588c6E309C31649CAB6B7BE',
        },
        {
            name: 'Aave',
            address: '0xdf5E77333A936A7d971D3be3E7D17c8f4243de08',
        },
        {
            name: 'Maker',
            address: '0x4C174E69C25fddc154F433b3768CD736c9Af61AF',
        },
        {
            name: 'Dai',
            address: '0x45CB06957453e15423186059F352aa89AC2b7c04',
        },
        {
            name: 'Syntethix',
            address: '0xFD7A30c1A3D2b9f6e095D383c2c269A5225D2bEB',
        },
        {
            name: 'Compound',
            address: '0xc0375421862502a08B55C4AbD7AA6853E5C5eD4b',
        },
        {
            name: 'Sushi',
            address: '0xf7BBBb0523cC315166F6fb0e2FB2c1E87e610f01',
        },
        {
            name: 'Basic Attention Token',
            address: '0x40C77f88423Ac9A2a14A49678dff3471194a542c',
        },
        {
            name: '0x',
            address: '0xB2FB1830a4C0CDCa8eA4437eE6869E23d630c2f0',
        },
        {
            name: 'Year.Finance',
            address: '0xB39317BaAFA045b2eA5AaaBFf25aCE586B6f9f08',
        },
        {
            name: 'Bancor',
            address: '0xa1E6dB6892732c6EBfc5E31728C2868eE21c3A34',
        },
        {
            name: 'Curve',
            address: '0xD85F30cA35E3F8F25085318A7D5E048c23f9924D',
        },
        {
            name: '1inch',
            address: '0x8aB3Fe15c6A1F0E17B52737A7D04FeC4ACd2A201',
        },
        {
            name: 'eqz',
            address: '0x3d53b79782Cc3c0486237d29B75C3e6E7D954694',
        },
    ];

    for (const vault of vaults) {
        console.log('Vault: ', vault.name);
        const existingVault = await ethers.getContractAt('Vault', vault.address);
        await (await existingVault.setFee(5, 10000)).wait(1);
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
