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

    require(
      c >= a,
      "MathLib#1"
    );

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
    require(
      b <= a,
      "MathLib#2"
    );

    return a - b;
  }

  function mul(
    uint256 a,
    uint256 b
  )
    internal
    pure
    returns (uint256 result)
  {
    if (a != 0 && b != 0) {
      result = a * b;

      require(
        result / a == b,
        "MathLib#3"
      );
    }

    return result;
  }

  function div(
    uint256 a,
    uint256 b
  )
    internal
    pure
    returns (uint256)
  {
    require(
      b != 0,
      "MathLib#4"
    );

    return a / b;
  }

  function percent(
    uint256 a,
    uint256 p
  )
    internal
    pure
    returns (uint256 result)
  {
    if (a != 0 && p != 0) {
      result = div(mul(a, p), 100);
    }

    return result;
  }
}
