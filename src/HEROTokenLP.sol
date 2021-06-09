// SPDX-License-Identifier: MIT
pragma solidity ^0.6.12;

import "./HEROTokenEconomy.sol";


/**
 * @title HERO token liquidity pool module
 */
contract HEROTokenLP is HEROTokenEconomy {
  /**
   * @dev Internal constructor
   */
  constructor ()
    internal
  {
    //
  }

  // external functions

  function _initializeLP()
    internal
  {
    // TODO
  }

  // internal functions

  function _increaseTotalLP(
    uint256 amount
  )
    internal
    override
  {
    // TODO

    summary.totalLP = summary.totalLP.add(amount);
  }
}
