// SPDX-License-Identifier: MIT
pragma solidity ^0.6.12;

import "./MetaheroLPM.sol";

/**
 * @title Metahero liquidity pool manager mock
 *
 * @author Stanisław Głogowski <stan@metahero.io>
 */
contract MetaheroLPMMock is MetaheroLPM {
  bool private shouldSyncLPBefore;
  bool private shouldSyncLPAfter;

  // events

  event Triggered();

  event LPSynced();

  /**
   * @dev Public constructor
   */
  constructor() public MetaheroLPM() {
    //
  }

  // external functions

  function triggerOnlyToken() external onlyToken {
    emit Triggered();
  }

  function initialize(address token_) external {
    _initialize(token_);
  }

  function setLocked(bool locked_) external {
    locked = locked_;
  }

  function allowSyncLP(bool shouldSyncLPBefore_, bool shouldSyncLPAfter_)
    external
  {
    shouldSyncLPBefore = shouldSyncLPBefore_;
    shouldSyncLPAfter = shouldSyncLPAfter_;
  }

  // external functions (views)

  function canSyncLP(address, address)
    external
    view
    override
    returns (bool, bool)
  {
    return (shouldSyncLPBefore, shouldSyncLPAfter);
  }

  // internal functions

  function _syncLP() internal override {
    emit LPSynced();
  }

  function _burnLP(uint256) internal override {
    emit Triggered();
  }
}
