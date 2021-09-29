// SPDX-License-Identifier: MIT
pragma solidity ^0.6.12;

import "./core/access/Owned.sol";
import "./core/lifecycle/Initializable.sol";
import "./core/math/SafeMathLib.sol";
import "./MetaheroToken.sol";


/**
 * @title Metahero airdrop
 *
 * @author Stanisław Głogowski <stan@metahero.io>
 */
contract MetaheroAirdrop is Owned, Initializable {
  /**
   * @return settings object
   */
  MetaheroToken public token;

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

    token = MetaheroToken(token_);

    emit Initialized(
      token_
    );
  }

  function batchTransfer(
    address[] calldata recipients,
    uint256[] calldata amounts
  )
    external
    onlyOwner
  {
    require(
      recipients.length != 0,
      "MetaheroAirdrop#1"
    );

    require(
      recipients.length == amounts.length,
      "MetaheroAirdrop#2"
    );

    uint256 len = recipients.length;

    for (uint256 index; index < len; index++) {
      address recipient = recipients[index];
      uint256 amount = amounts[index];

      if (
        recipient != address(0) &&
        amount != 0
      ) {
        token.transfer(recipient, amount);
      }
    }
  }
}
