// SPDX-License-Identifier: MIT
pragma solidity ^0.6.12;
pragma experimental ABIEncoderV2;

import "./core/lifecycle/Initializable.sol";


/**
 * @title Metahero swap router
 *
 * @author Stanisław Głogowski <stan@metahero.io>
 */
contract MetaheroSwapRouter is Initializable {
  address public factory;

  // events

  /**
   * @dev Emitted when the contract is initialized
   * @param factory factory address
   */
  event Initialized(
    address factory
  );

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

  /**
   * @dev Initializes the contract
   * @param factory_ factory address
   */
  function initialize(
    address factory_
  )
    external
    onlyInitializer
  {
    require(
      factory_ != address(0),
      "MetaheroSwapRouter#1" // factory is the zero address
    );

    factory = factory_;

    emit Initialized(
      factory_
    );
  }
}
