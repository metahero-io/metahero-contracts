// SPDX-License-Identifier: MIT
pragma solidity ^0.6.12;

import "./HEROLPManager.sol";


/**
 * @title HERO liquidity pool manager mock
 *
 * @author Stanisław Głogowski <stan@metahero.io>
 */
contract HEROLPManagerMock is HEROLPManager {
  uint256 public syncedBalance;

  bool private shouldSyncLPBefore;
  bool private shouldSyncLPAfter;

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
  {
    _initialize(token_);
  }

  function setLocked(
    bool locked_
  )
    external
  {
    locked = locked_;
  }

  function allowSyncLP(
    bool shouldSyncLPBefore_,
    bool shouldSyncLPAfter_
  )
    external
  {
    shouldSyncLPBefore = shouldSyncLPBefore_;
    shouldSyncLPAfter = shouldSyncLPAfter_;
  }

  // external functions (views)

  function canSyncLP(
    address,
    address
  )
    external
    view
    override
    returns (bool, bool)
  {
    return (shouldSyncLPBefore, shouldSyncLPAfter);
  }

  // internal functions

  function _syncLP()
    internal
    override
  {
    syncedBalance = token.balanceOf(address(this));
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

    _syncLP();
  }
}
