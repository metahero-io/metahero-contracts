// SPDX-License-Identifier: MIT
pragma solidity ^0.6.12;

import "./MathLib.sol";


/**
 * @title Math library mock
 *
 * @author Stanisław Głogowski <stan@metahero.io>
 */
contract MathLibMock {
  using MathLib for uint256;

  // external functions (pure)

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
