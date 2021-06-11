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

    require(c >= a, "MathLib: addition overflow");

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
    require(b <= a, "MathLib: subtraction overflow");

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
    if (a == 0 || b == 0) {
      return 0;
    }

    uint256 c = a * b;

    require(c / a == b, "MathLib: multiplication overflow");

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
    require(b != 0, "MathLib: division by zero");

    return a / b;
  }

  function percent(
    uint256 a,
    uint256 p
  )
    internal
    pure
    returns (uint256)
  {
    uint256 result;

    if (a != 0 && p != 0) {
      result = div(mul(a, p), 100);
    }

    return result;
  }
}
