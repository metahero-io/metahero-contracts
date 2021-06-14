// SPDX-License-Identifier: MIT
pragma solidity ^0.6.12;
pragma experimental ABIEncoderV2;

import "./HEROTokenLP.sol";


/**
 * @title HERO token liquidity pool module (mock)
 */
contract HEROTokenLPMock is HEROTokenLP {
  /**
   * @dev Public constructor
   */
  constructor ()
    public
    HEROTokenLP()
  {
    //
  }

  // external functions

  function initialize(
    Fees calldata lpFees,
    Fees calldata rewardsFees,
    bool presale,
    uint256 totalSupply_,
    address[] calldata excluded_,
    address swapRouter_
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

    _initializeLP(
      swapRouter_
    );
  }
}
