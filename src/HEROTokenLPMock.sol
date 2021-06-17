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
    uint256 totalSupply_,
    address[] calldata excluded_,
    uint256 enableBurnLPAtValue,
    address swapRouter_,
    address stableCoin_
  )
    external
  {
    _initializeEconomy(
      lpFees,
      rewardsFees,
      totalSupply_,
      excluded_
    );

    _initializeLP(
      enableBurnLPAtValue,
      swapRouter_,
      stableCoin_
    );
  }
}
