// SPDX-License-Identifier: MIT
pragma solidity ^0.6.12;

import "./access/Lockable.sol";
import "./access/Owned.sol";
import "./lifecycle/Initializable.sol";
import "./math/SafeMathLib.sol";
import "./HEROToken.sol";


/**
 * @title HERO abstract liquidity pool manager
 *
 * @author Stanisław Głogowski <stan@metahero.io>
 */
abstract contract HEROLPManager is Lockable, Owned, Initializable {
  using SafeMathLib for uint256;

  HEROToken public token;

  // modifiers

  modifier onlyToken() {
    require(
      msg.sender == address(token),
      "HEROLPManager#1"
    );

    _;
  }

  /**
   * @dev Internal constructor
   */
  constructor ()
    internal
    Lockable()
    Owned()
    Initializable()
  {
    //
  }

  // external functions

  function syncLP()
    external
    onlyToken
    lock
  {
    _syncLP();
  }

  function burnLP(
    uint256 amount
  )
    external
    onlyOwner
    lockOrThrowError
  {
    require(
      amount != 0,
      "HEROLPManager#2"
    );

    _burnLP(amount);
  }

  // external functions (views)

  function canSyncLP(
    address sender,
    address recipient
  )
    external
    view
    virtual
    returns (
      bool shouldSyncLPBefore,
      bool shouldSyncLPAfter
    );

  // internal functions

  function _initialize(
    address token_
  )
    internal
  {
    require(
      token_ != address(0),
      "HEROLPManager#3"
    );

    token = HEROToken(token_);
  }

  function _syncLP()
    internal
    virtual;

  function _burnLP(
    uint256 amount
  )
    internal
    virtual;
}
