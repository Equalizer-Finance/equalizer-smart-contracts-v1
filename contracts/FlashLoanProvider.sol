// SPDX-License-Identifier: BUSL-1.1

pragma solidity 0.8.4;

import './interfaces/IERC3156FlashLender.sol';
import './VaultFactory.sol';

contract FlashLoanProvider is IERC3156FlashLender {
    event FlashLoan(
        address indexed receiver,
        address token,
        uint256 amount,
        uint256 fee,
        uint256 treasuryFee
    );
    bytes32 public constant CALLBACK_SUCCESS = keccak256('ERC3156FlashBorrower.onFlashLoan');

    VaultFactory public immutable vaultFactory;

    constructor(VaultFactory _vaultFactory) {
        vaultFactory = _vaultFactory;
    }

    /**
     * @dev Flash fee to be charged based on token and amount.
     * @param token The loan currency.
     * @param amount The amount of tokens lent.
     * @return The amount of `token` to be charged for the loan, on top of the returned principal.
     */
    function flashFee(address token, uint256 amount) external view override returns (uint256) {
        require(
            vaultFactory.tokenToVault(token) != address(0),
            'FLASH_LENDER_UNSUPPORTED_CURRENCY'
        );
        return _flashFee(token, amount);
    }

    /**
     * @dev Fee to be charged for a given loan. Internal function with no checks.
     * @param token The loan currency.
     * @param amount The amount of tokens lent.
     * @return The amount of `token` to be charged for the loan, on top of the returned principal.
     */
    function _flashFee(address token, uint256 amount) internal view returns (uint256) {
        return Vault(vaultFactory.tokenToVault(token)).calculateFeeForAmount(amount);
    }

    /**
     * @dev The amount of currency available to be lent.
     * @param token The loan currency.
     * @return The amount of `token` that can be borrowed.
     */
    function maxFlashLoan(address token) external view override returns (uint256) {
        if (vaultFactory.tokenToVault(token) == address(0)) {
            return 0;
        }
        return ERC20(token).balanceOf(vaultFactory.tokenToVault(token));
    }

    /**
     * @dev Loan `amount` tokens to `receiver`, and takes it back plus a `flashFee` after the callback.
     * @param receiver The contract receiving the tokens,
     * needs to implement the `onFlashLoan(address user, uint256 amount, uint256 fee, bytes calldata)` interface.
     * @param token The loan currency.
     * @param amount The amount of tokens lent.
     * @param data A data parameter to be passed on to the `receiver` for any custom use.
     */
    function flashLoan(
        IERC3156FlashBorrower receiver,
        address token,
        uint256 amount,
        bytes calldata data
    ) external override returns (bool) {
        require(
            vaultFactory.tokenToVault(token) != address(0),
            'FLASH_LENDER_UNSUPPORTED_CURRENCY'
        );
        Vault vault = Vault(vaultFactory.tokenToVault(token));
        require(vault.isPaused() == false, 'VAULT_IS_PAUSED');
        require(amount > vault.minAmountForFlash(), 'FLASH_VALUE_IS_LESS_THAN_MIN_AMOUNT');
        require(
            amount <= vault.stakedToken().balanceOf(address(vault)),
            'AMOUNT_BIGGER_THAN_BALANCE'
        );
        uint256 fee = _flashFee(token, amount);
        require(vault.transferToAccount(address(receiver), amount), 'FLASH_LENDER_TRANSFER_FAILED');
        require(
            receiver.onFlashLoan(msg.sender, token, amount, fee, data) == CALLBACK_SUCCESS,
            'FLASH_LENDER_CALLBACK_FAILED'
        );
        require(
            ERC20(vault.stakedToken()).transferFrom(
                address(receiver),
                address(vault),
                amount + fee
            ),
            'FLASH_LENDER_REPAY_FAILED'
        );
        uint256 treasuryFee = vault.splitFees(fee);
        emit FlashLoan(address(receiver), token, amount, fee, treasuryFee);
        return true;
    }
}
