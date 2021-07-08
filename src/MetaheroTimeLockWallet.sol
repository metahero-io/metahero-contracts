// SPDX-License-Identifier: MIT
pragma solidity ^0.6.12;
pragma experimental ABIEncoderV2;

import "./core/lifecycle/Initializable.sol";
import "./core/math/SafeMathLib.sol";
import "./MetaheroToken.sol";


/**
 * @title Metahero time lock wallet
 *
 * @author Stanisław Głogowski <stan@metahero.io>
 */
contract MetaheroTimeLockWallet {
  bytes4 private constant ERC20_TRANSFER_SELECTOR = 0xa9059cbb; // bytes4(keccak256(bytes('transfer(address,uint256)')));

  /**
   * @return token address
   */
  address public token;

  /**
   * @return registry address
   */
  address public registry;

  /**
   * @dev Public constructor
   * @param token_ token address
   */
  constructor (
    address token_
  )
    public
  {
    token = token_;
    registry = msg.sender;
  }

  // external functions

  /**
   * @dev Transfers tokens
   * @param recipient recipient address
   * @param amount tokens amount
   */
  function transferTokens(
    address recipient,
    uint256 amount
  )
    external
  {
    require(
      msg.sender == registry,
      "MetaheroTimeLockWallet#1" // msg.sender is not the registry
    );

    (bool success, bytes memory response) = address(token).call( // solhint-disable-line avoid-low-level-calls
      abi.encodeWithSelector(ERC20_TRANSFER_SELECTOR, recipient, amount)
    );

    require(
      success && (
        response.length == 0 ||
        abi.decode(response, (bool))
      ),
      "MetaheroTimeLockWallet#2" // transfer failed
    );
  }
}
