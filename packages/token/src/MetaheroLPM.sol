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
 * @author Stanisław Głogowski <stan@metahero.io>
 */
abstract contract MetaheroLPM is Lockable, Owned, Initializable {
  using SafeMathLib for uint256;

  /**
   * @return token address
   */
  MetaheroToken public token;

  // modifiers

  /**
   * @dev Throws if msg.sender is not the token
   */
  modifier onlyToken() {
    require(
      msg.sender == address(token),
      "MetaheroLPM#1" // msg.sender is not the token
    );

    _;
  }

  // events

  /**
   * @dev Emitted when tokens from the liquidity pool are burned
   * @param amount burnt amount
   */
  event LPBurnt(uint256 amount);

  /**
   * @dev Internal constructor
   */
  constructor() internal Lockable() Owned() Initializable() {
    //
  }

  // external functions

  /**

   * @notice Syncs liquidity pool
   */
  function syncLP() external onlyToken lock {
    _syncLP();
  }

  /**
   * @notice Burns tokens from the liquidity pool
   * @param amount tokens amount
   */
  function burnLP(uint256 amount) external onlyOwner lockOrThrowError {
    require(
      amount != 0,
      "MetaheroLPM#2" // amount is zero
    );

    _burnLP(amount);

    emit LPBurnt(amount);
  }

  // external functions (views)

  function canSyncLP(address sender, address recipient)
    external
    view
    virtual
    returns (bool shouldSyncLPBefore, bool shouldSyncLPAfter);

  // internal functions

  function _initialize(address token_) internal {
    require(
      token_ != address(0),
      "MetaheroLPM#3" // token is the zero address
    );

    token = MetaheroToken(token_);
  }

  function _syncLP() internal virtual;

  function _burnLP(uint256 amount) internal virtual;
}
