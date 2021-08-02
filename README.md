<!-- PROJECT SHIELDS -->
<!--
*** I'm using markdown "reference style" links for readability.
*** Reference links are enclosed in brackets [ ] instead of parentheses ( ).
*** See the bottom of this document for the declaration of the reference variables
*** for contributors-url, forks-url, etc. This is an optional, concise syntax you may use.
*** https://www.markdownguide.org/basic-syntax/#reference-style-links
-->

[![BSL 1.1 License][license-shield]][license-url]
[![LinkedIn][linkedin-shield]][linkedin-url]
<!-- 
[![Contributors][contributors-shield]][contributors-url]
[![Forks][forks-shield]][forks-url]
[![Stargazers][stars-shield]][stars-url]
[![Issues][issues-shield]][issues-url]
-->

<!-- PROJECT LOGO -->
<br />
<p align="center">
  <a href="https://github.com/Equalizer-Finance">
    <img src="https://avatars.githubusercontent.com/u/81406956?s=200&v=4" alt="Logo" width="80" height="80">
  </a>

<h2 align="center">Equalizer - Smart Contracts V1</h2>

<!-- PROJECT Summary -->
### Project Summary
  <p align="center">
    Equalizer Vaults/Flash Loan Contracts
       <br />
    <strong>Version: V1</strong><br />
    <a href="https://docs.equalizer.finance/"><strong>Explore the docs »</strong></a>
    <br />
    <br />
<!--    <a href="https://github.com/Equalizer-Finance/README.md">View Demo</a>
    ·
    <a href="https://github.com/Equalizer-Finance/README.md">Report Bug</a>
    ·
    <a href="https://github.com/Equalizer-Finance/README.md">Request Feature</a>
    -->
  </p>
</p>



<!-- TABLE OF CONTENTS -->
<details open="open">
  <summary><strong>Table of Contents</strong></summary>
  <ol>
    <li>
      <a href="#getting-started">Getting Started</a>
      <ul>
        <li><a href="#installation">Installation</a></li>
        <li><a href="#build">Build</a></li>
        <li><a href="#deploy">Running/Deploy guide</a></li>
        <li><a href="#testing">Testing/Debugging/Troubleshooting</a></li>
      </ul>
    </li>
    <li><a href="#roadmap">Roadmap</a></li>
    <li><a href="#contributing">Contributing</a></li>
    <li><a href="#license">License</a></li>
    <li><a href="#contact">Contact</a></li>
  </ol>
</details>

<!-- GETTING STARTED -->
## Getting Started

In order you get started you have to install [NodeJs](https://nodejs.org/en/download/) and [Yarn](https://classic.yarnpkg.com/en/docs/install/#mac-stable)

### Installation

1. Clone the repo
2. Run `yarn install`
3. Copy `.env.sample` file to `.env`
4. Fill the variables from .env file: `ETHERSCAN_API_KEY`, `WALLET_PRIV_KEY`, `RPC_URL`

### Build
`yarn compile`

### Deploy
For deployment you have to check the available scripts. The pattern for using a scripts is:
```npx hardhat run scripts/<script_name>.ts --network <rinkeby/mainnet>```

In order to make the deployment process you have to run in order:
1. `deployVaultFactory.ts`;
2. `deployFlashLoanProvider.ts`;
3. `initializeVaultFactory.ts`;
4. `deployTokens.ts`
5. `deployVaults.ts`;
6. `deployFlashBorrowerTestnet.ts`

**NOTE**
In each step you have to check the script you are running and change the config needed. For example `deployFlashLoanProvider.ts` (step 1)
 requires the `VaultFactory` contract address from step 1.
### Testing
`yarn test`

<!-- ROADMAP -->
## Roadmap

See the [open issues](https://github.com/Equalizer-Finance/equalizer-smart-contracts-v1/issues) for a list of proposed features (and known issues).



<!-- CONTRIBUTING -->
## Contributing

Contributions are what make the open source community such an amazing place to be learn, inspire, and create. Any contributions you make are **greatly appreciated**.

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request



<!-- LICENSE -->
## License

Distributed under the BSL 1.1 License. See `LICENSE` for more information.



<!-- CONTACT -->
## Contact

Equalizer - [@EqualizerFlash](https://twitter.com/EqualizerFlash) - info (a) equalizer.finance

Project Link: [https://github.com/Equalizer-Finance/equalizer-smart-contracts-v1](https://github.com/Equalizer-Finance/equalizer-smart-contracts-v1)
<!-- MARKDOWN LINKS & IMAGES -->
<!-- https://www.markdownguide.org/basic-syntax/#reference-style-links -->


[license-shield]: https://img.shields.io/badge/license-BSL%201.1-green?style=for-the-badge
[license-url]: https://github.com/Equalizer-Finance/equalizer-smart-contracts-v1/blob/main/LICENSE.txt
[linkedin-shield]: https://img.shields.io/badge/-LinkedIn-black.svg?style=for-the-badge&logo=linkedin&colorB=555
[linkedin-url]: https://www.linkedin.com/company/equalizerflash

[product-screenshot]: images/screenshot.png
<!--
[contributors-shield]:https://img.shields.io/badge/contributors-11-green??style=for-the-badge
[contributors-url]:   https://github.com/Equalizer-Finance/equalizer-architecture/graphs/contributors
[forks-shield]: https://img.shields.io/?style=for-the-badge
[forks-url]:  https://github.com/Equalizer-Finance/equalizer-architecture/network/members
[stars-shield]: https://img.shields.io/?style=for-the-badge
[stars-url]: https://github.com/Equalizer-Finance/equalizer-architecture/stargazers
[issues-shield]: https://img.shields.io/?style=for-the-badge
[issues-url]: https://github.com/Equalizer-Finance/equalizer-architecture/issues
-->
