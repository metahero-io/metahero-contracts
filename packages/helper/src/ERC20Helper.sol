// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/Address.sol";

/**
 * @title ERC20 Helper
 *
 * @author Stanisław Głogowski <stan@metahero.io>
 */
contract ERC20Helper {
  using Address for address;

  // constructor

  constructor() {
    //
  }

  // external functions (views)

  function getAllowances(
    address[] calldata tokens,
    address account,
    address spender
  ) external view returns (uint256[] memory result) {
    uint256 len = tokens.length;

    result = new uint256[](len);

    for (uint256 index; index < len; ) {
      address token = tokens[index];

      if (token.isContract()) {
        // solhint-disable-next-line avoid-low-level-calls
        (bool methodExists, bytes memory methodResponse) = token.staticcall(
          abi.encodeWithSelector(
            IERC20(token).allowance.selector,
            account,
            spender
          )
        );

        if (methodExists) {
          (result[index]) = abi.decode(methodResponse, (uint256));
        }
      }

      unchecked {
        ++index;
      }
    }

    return result;
  }

  function getBalances(address[] calldata tokens, address account)
    external
    view
    returns (uint256[] memory result)
  {
    uint256 len = tokens.length;

    result = new uint256[](len);

    for (uint256 index; index < len; index) {
      address token = tokens[index];

      if (token == address(0)) {
        result[index] = payable(account).balance;
      } else if (token.isContract()) {
        // solhint-disable-next-line avoid-low-level-calls
        (bool methodExists, bytes memory methodResponse) = token.staticcall(
          abi.encodeWithSelector(IERC20(token).balanceOf.selector, account)
        );

        if (methodExists) {
          (result[index]) = abi.decode(methodResponse, (uint256));
        }
      }

      unchecked {
        ++index;
      }
    }

    return result;
  }
}
