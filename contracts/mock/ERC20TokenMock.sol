// SPDX-License-Identifier: BUSL-1.1

pragma solidity 0.8.4;

import '@openzeppelin/contracts/token/ERC20/ERC20.sol';

contract ERC20TokenMock is ERC20 {
    uint8 nrOfDecimals;
    uint256 constant MINTED_VALUE = 1000000;

    constructor(
        string memory name,
        string memory symbol,
        uint8 _nrOfDecimals
    ) ERC20(name, symbol) {
        nrOfDecimals = _nrOfDecimals;
        _mint(msg.sender, MINTED_VALUE * (10**_nrOfDecimals));
    }

    function decimals() public view virtual override returns (uint8) {
        return nrOfDecimals;
    }
}
