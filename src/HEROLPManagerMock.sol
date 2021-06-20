// SPDX-License-Identifier: MIT
pragma solidity ^0.6.12;

import "./HEROLPManager.sol";


/**
 * @title HERO liquidity pool manager mock
 */
contract HEROLPManagerMock is HEROLPManager {
  uint256 public totalLP;

  /**
   * @dev Public constructor
   */
  constructor ()
    public
    HEROLPManager()
  {
    //
  }

  // external functions

  function initialize(
    address token_
  )
    external
    onlyInitializer
  {
    _initialize(token_);
  }

  // internal functions

  function _syncLP()
    internal
    override
  {
    totalLP = token.balanceOf(address(this));
  }

  function _burnLP(
    uint256 amount
  )
    internal
    override
  {
    token.burn(
      amount
    );

    totalLP = token.balanceOf(address(this));
  }
}