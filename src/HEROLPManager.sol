// SPDX-License-Identifier: MIT
pragma solidity ^0.6.12;

import "./access/Owned.sol";
import "./lifecycle/Initializable.sol";
import "./libs/MathLib.sol";
import "./HEROToken.sol";


/**
 * @title HERO abstract liquidity pool manager
 */
abstract contract HEROLPManager is Owned, Initializable {
  using MathLib for uint256;

  HEROToken public token;

  bool private swapLocked;

  /**
   * @dev Internal constructor
   */
  constructor ()
    internal
    Owned()
    Initializable()
  {
    //
  }

  // external functions

  receive()
    external
    payable
  {
    //
  }

  function syncLP()
    external
  {
    if (!swapLocked) {
      swapLocked = true;

      _syncLP();

      swapLocked = false;
    }
  }

  function burnLP(
    uint256 amount
  )
    external
    onlyOwner
  {
    require(
      amount > 1,
      "HEROLPManager#1"
    );

    require(
      !swapLocked,
      "HEROLPManager#2"
    );

    swapLocked = true;

    _burnLP(amount);

    swapLocked = false;
  }

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
