// SPDX-License-Identifier: MIT
pragma solidity ^0.6.12;
pragma experimental ABIEncoderV2;

import "./components/Initializable.sol";
import "./HEROTokenEconomy.sol";


/**
 * @title HERO token economy module (mock)
 */
contract HEROTokenEconomyMock is Initializable, HEROTokenEconomy {
  /**
   * @dev Public constructor
   */
  constructor ()
    public
    Initializable()
  {
    //
  }

  // external functions

  function initialize(
    Fees calldata lpFees,
    Fees calldata rewardsFees,
    uint256 totalSupply_,
    address[] calldata excluded_
  )
    external
    onlyInitializer
  {
    _initializeEconomy(
      lpFees,
      rewardsFees,
      totalSupply_,
      excluded_
    );
  }
}
