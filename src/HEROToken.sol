// SPDX-License-Identifier: MIT
pragma solidity ^0.6.12;
pragma experimental ABIEncoderV2;

import "./components/ERC20Metadata.sol";
import "./components/Initializable.sol";
import "./HEROTokenLP.sol";


/**
 * @title HERO token
 */
contract HEROToken is ERC20Metadata, Initializable, HEROTokenLP {
  // metadata
  string private constant TOKEN_NAME = "Metahero";
  string private constant TOKEN_SYMBOL = "HERO";
  uint8 private constant TOKEN_DECIMALS = 18; // 0.000000000000000000

  /**
   * @dev Public constructor
   */
  constructor ()
    public
    ERC20Metadata(
      Metadata(TOKEN_NAME, TOKEN_SYMBOL, TOKEN_DECIMALS)
    )
    Initializable()
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
    onlyInitializer
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
