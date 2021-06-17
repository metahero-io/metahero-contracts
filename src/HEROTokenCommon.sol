// SPDX-License-Identifier: MIT
pragma solidity ^0.6.12;
pragma experimental ABIEncoderV2;

import "./components/Controlled.sol";
import "./libs/MathLib.sol";


/**
 * @title HERO token common module
 */
abstract contract HEROTokenCommon is Controlled {
  using MathLib for uint256;

  struct Fees {
    uint256 sender; // percent
    uint256 recipient; // percent
  }

  struct Settings {
    Fees lpFees;
    Fees rewardsFees;
    uint256 enableBurnLPAtValue;
  }

  Settings public settings;

  /**
   * @dev Internal constructor
   */
  constructor ()
    internal
    Controlled()
  {
    //
  }
}
