// SPDX-License-Identifier: MIT
pragma solidity ^0.6.12;

import "./SafeMathLib.sol";


/**
 * @title Math library
 *
 * @author Stanisław Głogowski <stan@metahero.io>
 */
library MathLib {
  using SafeMathLib for uint256;

  // internal functions (pure)

  /**
   * @notice Calcs a x p / 100
   */
  function percent(
    uint256 a,
    uint256 p
  )
    internal
    pure
    returns (uint256 result)
  {
    if (a != 0 && p != 0) {
      result = a.mul(p).div(100);
    }

    return result;
  }
}
