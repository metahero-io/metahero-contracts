// SPDX-License-Identifier: MIT
pragma solidity ^0.6.12;

import "./ERC20Mock.sol";
import "./IWrappedNative.sol";


/**
 * @title Wrapped native mock
 *
 * @author Stanisław Głogowski <stan@metahero.io>
 */
contract WrappedNativeMock is IWrappedNative, ERC20Mock {
  using SafeMathLib for uint256;

  /**
   * @dev Public constructor
   */
  constructor ()
    public
    ERC20Mock()
  {
    //
  }

  // external functions

  function deposit()
    external
    override
    payable
  {
    require(
      msg.value != 0,
      "WrappedNativeMock#1"
    );

    totalSupply = totalSupply.add(msg.value);
    balanceOf[msg.sender] = balanceOf[msg.sender].add(msg.value);

    emit Transfer(
      address(0),
      msg.sender,
      msg.value
    );
  }

  function withdraw(
    uint256 amount
  )
    external
    override
  {
    require(
      amount <= balanceOf[msg.sender],
      "WrappedNativeMock#2"
    );

    totalSupply = totalSupply.sub(amount);
    balanceOf[msg.sender] = balanceOf[msg.sender].sub(amount);

    emit Transfer(
      msg.sender,
      address(0),
      amount
    );
  }
}
