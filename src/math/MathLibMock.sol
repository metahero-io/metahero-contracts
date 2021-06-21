// SPDX-License-Identifier: MIT
pragma solidity ^0.6.12;

import "./MathLib.sol";


/**
 * @title Math library mock
 */
contract MathLibMock {
  using MathLib for uint256;

  // external functions (pure)

  function add(
    uint256 a,
    uint256 b
  )
    external
    pure
    returns (uint256)
  {
    return a.add(b);
  }

  function sub(
    uint256 a,
    uint256 b
  )
    external
    pure
    returns (uint256)
  {
    return a.sub(b);
  }

  function mul(
    uint256 a,
    uint256 b
  )
    external
    pure
    returns (uint256)
  {
    return a.mul(b);
  }

  function div(
    uint256 a,
    uint256 b
  )
    external
    pure
    returns (uint256)
  {
    return a.div(b);
  }

  function percent(
    uint256 a,
    uint256 p
  )
    external
    pure
    returns (uint256)
  {
    return a.percent(p);
  }
}
