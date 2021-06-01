// SPDX-License-Identifier: MIT
pragma solidity ^0.6.12;

/**
 * @title Math library
 */
library MathLib {
  function add(
    uint256 a,
    uint256 b
  )
    internal
    pure
    returns (uint256)
  {
    uint256 c = a + b;

    require(c >= a, "Math: addition overflow");

    return c;
  }

  function sub(
    uint256 a,
    uint256 b
  )
    internal
    pure
    returns (uint256)
  {
    require(b <= a, "Math: subtraction overflow");

    return a - b;
  }

  function mul(
    uint256 a,
    uint256 b
  )
    internal
    pure
    returns (uint256)
  {
    if (a == 0) {
      return 0;
    }

    uint256 c = a * b;

    require(c / a == b, "Math: multiplication overflow");

    return c;
  }

  function div(
    uint256 a,
    uint256 b
  )
    internal
    pure
    returns (uint256)
  {
    require(b > 0, "Math: division by zero");

    return a / b;
  }

  function mod(
    uint256 a,
    uint256 b
  )
    internal
    pure
    returns (uint256)
  {
    require(b != 0, "Math: modulo by zero");

    return a % b;
  }
}
