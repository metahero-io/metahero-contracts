// SPDX-License-Identifier: GPL-3.0
/* solhint-disable */
pragma solidity ^0.6.12;

/**
 * @title Pancake math library
 *
 * @notice Based on https://github.com/pancakeswap/pancake-swap-core/blob/3b214306770e86bc3a64e67c2b5bdb566b4e94a7/contracts/libraries/Math.sol
 */
library PancakeMath {
  // internal functions (pure)

  function min(uint256 x, uint256 y) internal pure returns (uint256) {
    return x < y ? x : y;
  }

  function sqrt(uint256 y) internal pure returns (uint256 z) {
    if (y > 3) {
      z = y;
      uint256 x = y / 2 + 1;
      while (x < z) {
        z = x;
        x = (y / x + x) / 2;
      }
    } else if (y != 0) {
      z = 1;
    }

    return z;
  }
}
