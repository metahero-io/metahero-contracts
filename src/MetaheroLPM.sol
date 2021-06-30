// SPDX-License-Identifier: MIT
pragma solidity ^0.6.12;

import "./core/access/Lockable.sol";
import "./core/access/Owned.sol";
import "./core/lifecycle/Initializable.sol";
import "./core/math/SafeMathLib.sol";
import "./MetaheroToken.sol";


/**
 * @title Metahero abstract liquidity pool manager
 *
 * @author Stanisław Głogowski <stan@metaMetahero.io>
 */
abstract contract MetaheroLPM is Lockable, Owned, Initializable {
  using SafeMathLib for uint256;

  MetaheroToken public token;

  // modifiers

  modifier onlyToken() {
    require(
      msg.sender == address(token),
      "MetaheroLPM#1"
    );

    _;
  }

  // events

  event LPBurnt(
    uint256 amount
  );

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
      "MetaheroLPM#2"
    );

    _burnLP(amount);

    emit LPBurnt(
      amount
    );
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
      "MetaheroLPM#3"
    );

    token = MetaheroToken(token_);
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
