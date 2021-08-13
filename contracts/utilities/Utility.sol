//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import '@openzeppelin/contracts/token/ERC20/IERC20.sol';
import '@openzeppelin/contracts/token/ERC721/ERC721.sol';

import '../CoreConstants.sol';

interface VaultInterface {
    /**
     * @dev Returns the amount of tokens in existence.
     */
    function totalSupply() external view returns (uint256);

    /**
     * @dev Returns the amount of tokens owned by `account`.
     */
    function balanceOf(address account) external view returns (uint256);

    /**
     * @dev Moves `amount` tokens from the caller's account to `recipient`.
     *
     * Returns a boolean value indicating whether the operation succeeded.
     *
     * Emits a {Transfer} event.
     */
    function transfer(address recipient, uint256 amount) external returns (bool);

    /**
     * @dev Returns the remaining number of tokens that `spender` will be
     * allowed to spend on behalf of `owner` through {transferFrom}. This is
     * zero by default.
     *
     * This value changes when {approve} or {transferFrom} are called.
     */
    function allowance(address owner, address spender) external view returns (uint256);

    /**
     * @dev Sets `amount` as the allowance of `spender` over the caller's tokens.
     *
     * Returns a boolean value indicating whether the operation succeeded.
     *
     * IMPORTANT: Beware that changing an allowance with this method brings the risk
     * that someone may use both the old and the new allowance by unfortunate
     * transaction ordering. One possible solution to mitigate this race
     * condition is to first reduce the spender's allowance to 0 and set the
     * desired value afterwards:
     * https://github.com/ethereum/EIPs/issues/20#issuecomment-263524729
     *
     * Emits an {Approval} event.
     */
    function approve(address spender, uint256 amount) external returns (bool);

    /**
     * @dev Moves `amount` tokens from `sender` to `recipient` using the
     * allowance mechanism. `amount` is then deducted from the caller's
     * allowance.
     *
     * Returns a boolean value indicating whether the operation succeeded.
     *
     * Emits a {Transfer} event.
     */
    function transferFrom(
        address sender,
        address recipient,
        uint256 amount
    ) external returns (bool);

    function getRatioForOneEToken() external view returns (uint256);

    function decimals() external view returns (uint8);

    function totalAmountDeposited() external view returns (uint256);

    /**
     * @dev Emitted when `value` tokens are moved from one account (`from`) to
     * another (`to`).
     *
     * Note that `value` may be zero.
     */
    event Transfer(address indexed from, address indexed to, uint256 value);

    /**
     * @dev Emitted when the allowance of a `spender` for an `owner` is set by
     * a call to {approve}. `value` is the new allowance.
     */
    event Approval(address indexed owner, address indexed spender, uint256 value);
}

interface IYieldFarm {
    enum NftTypes {principal, bonus}

    struct NFTMetadata {
        address token;
        uint256 amount;
        uint256 depositTime;
        uint256 endTime;
        bool claimed;
        NftTypes nftType;
    }

    function getNftMetadata(uint256 _tokenId) external view returns (NFTMetadata memory);
}

contract Utility is CoreConstants {
    struct NFTInfo {
        uint256 nftId;
        address owner;
        IYieldFarm.NFTMetadata metadata;
    }

    function getUserTokenBalance(address[] memory tokenAddresses, address[] memory user)
        external
        view
        returns (uint256[] memory)
    {
        require(tokenAddresses.length <= 10);
        require(tokenAddresses.length == user.length);

        uint256 length = tokenAddresses.length;
        uint256[] memory result = new uint256[](length);

        for (uint256 i = 0; i < length; i++) {
            result[i] = IERC20(tokenAddresses[i]).balanceOf(user[i]);
        }

        return result;
    }

    function getUserVaultDeposit(address[] memory vaultAddresses, address[] memory user)
        external
        view
        returns (uint256[] memory)
    {
        require(vaultAddresses.length <= 10);
        require(vaultAddresses.length == user.length);

        uint256 length = vaultAddresses.length;
        uint256[] memory result = new uint256[](length);

        for (uint256 i = 0; i < length; i++) {
            result[i] =
                (VaultInterface(vaultAddresses[i]).balanceOf(user[i]) *
                    VaultInterface(vaultAddresses[i]).getRatioForOneEToken()) /
                RATIO_MULTIPLY_FACTOR;
        }

        return result;
    }

    function getTokenDecimals(address[] memory tokenAddresses)
        external
        view
        returns (uint8[] memory)
    {
        uint256 length = tokenAddresses.length;
        uint8[] memory result = new uint8[](length);
        for (uint256 i = 0; i < length; i++) {
            result[i] = VaultInterface(tokenAddresses[i]).decimals();
        }
        return result;
    }

    function getTotalAmountDeposited(address[] memory tokenAddresses)
        external
        view
        returns (uint256[] memory)
    {
        uint256 length = tokenAddresses.length;
        uint256[] memory result = new uint256[](length);
        for (uint256 i = 0; i < length; i++) {
            result[i] = VaultInterface(tokenAddresses[i]).totalAmountDeposited();
        }
        return result;
    }

    function getNftInfo(
        address[] memory yieldFarmAddresses,
        address[] memory nftAddresses,
        uint256[] memory nftIds
    ) external view returns (NFTInfo[] memory) {
        require(yieldFarmAddresses.length <= 10);
        require(yieldFarmAddresses.length == nftAddresses.length);
        require(yieldFarmAddresses.length == nftIds.length);

        uint256 length = yieldFarmAddresses.length;
        NFTInfo[] memory result = new NFTInfo[](length);

        for (uint256 i = 0; i < length; i++) {
            result[i] = NFTInfo(
                nftIds[i],
                IERC721(nftAddresses[i]).ownerOf(nftIds[i]),
                IYieldFarm(yieldFarmAddresses[i]).getNftMetadata(nftIds[i])
            );
        }

        return result;
    }
}
