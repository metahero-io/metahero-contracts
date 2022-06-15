// SPDX-License-Identifier: MIT
pragma solidity ^0.6.12;
pragma experimental ABIEncoderV2;

import "./core/erc20/IERC20.sol";
import "./core/lifecycle/Initializable.sol";
import "./core/math/SafeMathLib.sol";
import "./MetaheroToken.sol";

/**
 * @title Metahero swap helper
 *
 * @author Stanisław Głogowski <stan@metahero.io>
 */
contract MetaheroSwapHelper is Initializable {
  using SafeMathLib for uint256;

  MetaheroToken public token;

  // events

  /**
   * @dev Emitted when the contract is initialized
   * @param token token address
   */
  event Initialized(address token);

  /**
   * @dev Public constructor
   */
  constructor() public Initializable() {
    //
  }

  // external functions

  /**
   * @dev Initializes the contract
   * @param token_ token address
   */
  function initialize(address token_) external onlyInitializer {
    require(
      token_ != address(0),
      "MetaheroSwapHelper#1" // token is the zero address
    );

    token = MetaheroToken(token_);

    emit Initialized(token_);
  }

  // external functions (views)

  function getAllowances(
    address payable account,
    address[] calldata tokens,
    address[] calldata spenders
  ) external view returns (uint256[] memory result) {
    uint256 len = tokens.length;

    if (len == spenders.length) {
      result = new uint256[](len);

      for (uint256 index; index < len; index++) {
        address token_ = tokens[index];
        address spender = spenders[index];

        uint256 tokenCode;

        // solhint-disable-next-line no-inline-assembly
        assembly {
          tokenCode := extcodesize(token_)
        } // contract code size

        if (tokenCode != 0) {
          // solhint-disable-next-line avoid-low-level-calls
          (bool methodExists, ) = token_.staticcall(
            abi.encodeWithSelector(
              IERC20(token_).allowance.selector,
              account,
              spender
            )
          );

          if (methodExists) {
            result[index] = IERC20(token_).allowance(account, spender);
          }
        }
      }
    }

    return result;
  }

  function getBalances(address payable account, address[] calldata tokens)
    external
    view
    returns (
      uint256 nativeBalance,
      uint256 tokenHoldingBalance,
      uint256 tokenTotalRewards,
      uint256[] memory tokensBalances
    )
  {
    nativeBalance = account.balance;

    (, tokenHoldingBalance, tokenTotalRewards) = token.getBalanceSummary(
      account
    );

    uint256 len = tokens.length;

    if (len != 0) {
      tokensBalances = new uint256[](len);

      for (uint256 index; index < len; index++) {
        address token_ = tokens[index];
        uint256 tokenCode;

        // solhint-disable-next-line no-inline-assembly
        assembly {
          tokenCode := extcodesize(token_)
        } // contract code size

        if (tokenCode != 0) {
          // solhint-disable-next-line avoid-low-level-calls
          (bool methodExists, ) = token_.staticcall(
            abi.encodeWithSelector(IERC20(token_).balanceOf.selector, account)
          );

          if (methodExists) {
            tokensBalances[index] = IERC20(token_).balanceOf(account);
          }
        }
      }
    }

    return (
      nativeBalance,
      tokenHoldingBalance,
      tokenTotalRewards,
      tokensBalances
    );
  }
}
