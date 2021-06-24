// SPDX-License-Identifier: MIT
pragma solidity ^0.6.12;

import "./SafeMathLib.sol";


/**
 * @title Safe math library mock
 *
 * @author Stanisław Głogowski <stan@metahero.io>
 */
contract SafeMathLibMock {
  using SafeMathLib for uint256;

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
}
