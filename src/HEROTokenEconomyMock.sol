// SPDX-License-Identifier: MIT
pragma solidity ^0.6.12;
pragma experimental ABIEncoderV2;

import "./HEROTokenEconomy.sol";


/**
 * @title HERO token economy module (mock)
 */
contract HEROTokenEconomyMock is HEROTokenEconomy {
  /**
   * @dev Public constructor
   */
  constructor ()
    public
    HEROTokenEconomy()
  {
    //
  }

  // external functions

  function initialize(
    Fees calldata lpFees,
    Fees calldata rewardsFees,
    bool presale,
    uint256 totalSupply_,
    address[] calldata excluded_
  )
    external
  {
    _initializeEconomy(
      lpFees,
      rewardsFees,
      presale,
      totalSupply_,
      excluded_
    );
  }
}
