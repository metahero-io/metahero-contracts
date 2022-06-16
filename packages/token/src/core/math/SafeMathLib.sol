// SPDX-License-Identifier: MIT
pragma solidity ^0.6.12;

/**
 * @title Safe math library
 *
 * @notice Based on https://github.com/OpenZeppelin/openzeppelin-contracts/blob/5fe8f4e93bd1d4f5cc9a6899d7f24f5ffe4c14aa/contracts/math/SafeMath.sol
 */
library SafeMathLib {
  // internal functions (pure)

  /**
   * @notice Calcs a + b
   */
  function add(uint256 a, uint256 b) internal pure returns (uint256) {
    uint256 c = a + b;

    require(c >= a, "SafeMathLib#1");

    return c;
  }

  /**
   * @notice Calcs a - b
   */
  function sub(uint256 a, uint256 b) internal pure returns (uint256) {
    require(b <= a, "SafeMathLib#2");

    return a - b;
  }

  /**
   * @notice Calcs a x b
   */
  function mul(uint256 a, uint256 b) internal pure returns (uint256 result) {
    if (a != 0 && b != 0) {
      result = a * b;

      require(result / a == b, "SafeMathLib#3");
    }

    return result;
  }

  /**
   * @notice Calcs a / b
   */
  function div(uint256 a, uint256 b) internal pure returns (uint256) {
    require(b != 0, "SafeMathLib#4");

    return a / b;
  }
}
