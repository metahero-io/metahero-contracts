// SPDX-License-Identifier: MIT
pragma solidity ^0.6.12;

import "./core/access/Owned.sol";
import "./core/lifecycle/Initializable.sol";
import "./core/math/SafeMathLib.sol";
import "./MetaheroToken.sol";


/**
 * @title Metahero air drop
 *
 * @author Stanisław Głogowski <stan@metahero.io>
 */
contract MetaheroAirDrop is Owned, Initializable {
  using SafeMathLib for uint256;

  /**
   * @return settings object
   */
  MetaheroToken public token;

  mapping (address => uint256) private amounts;

  // events

  /**
   * @dev Emitted when the contract is initialized
  * @param token token address
   */
  event Initialized(
    address token
  );

  /**
   * @dev Public constructor
   */
  constructor ()
    public
    Owned()
    Initializable()
  {
    //
  }

  // external functions

  /**
   * @dev Initializes the contract
   * @param token_ token address
   */
  function initialize(
    address token_
  )
    external
    onlyInitializer
  {
    require(
      token_ != address(0),
      "MetaheroAirdrop#1" // token is the zero address
    );

    emit Initialized(
      token_
    );
  }
}
