// SPDX-License-Identifier: BUSL-1.1

pragma solidity 0.8.4;

interface IVault {
    /**
     * @dev Emitted on new deposit.
     * @param sender address.
     * @param amount deposited.
     * @param tokensToMint on new deposit.
     **/
    event Deposit(
        address indexed sender,
        uint256 amount,
        uint256 tokensToMint,
        uint256 previousDepositBlockNr
    );

    /**
     * @dev Emitted on withdraw.
     * @param sender address to withdraw to.
     * @param amount of eTokens burned.
     * @param stakedTokensToTransfer to address.
     **/
    event Withdraw(address indexed sender, uint256 amount, uint256 stakedTokensToTransfer);

    /**
     * @dev Emitted on initialize.
     * @param treasuryAddress address of treasury where part of flash loan fee is sent.
     * @param flashLoanProvider provider of flash loans.
     * @param maxCapacity max capacity for a vault
     **/
    function initialize(
        address treasuryAddress,
        address flashLoanProvider,
        uint256 maxCapacity
    ) external;
}
