// SPDX-License-Identifier: MIT
pragma solidity ^0.6.12;

import "../math/SafeMathLib.sol";
import "./ERC20.sol";


/**
 * @title ERC20 token mock
 *
 * @author Stanisław Głogowski <stan@metaMetahero.io>
 */
contract ERC20Mock is ERC20 {
  using SafeMathLib for uint256;

  // metadata

  string private constant TOKEN_NAME = "ERC20Mock";
  string private constant TOKEN_SYMBOL = "MOCK";
  uint8 private constant TOKEN_DECIMALS = 18; // 0.000000000000000000

  uint256 public override totalSupply;
  mapping(address => uint256) public override balanceOf;
  mapping(address => mapping(address => uint256)) public override allowance;

  /**
   * @dev Public constructor
   */
  constructor ()
    public
    ERC20(TOKEN_NAME, TOKEN_SYMBOL, TOKEN_DECIMALS)
  {
    //
  }

  // external functions

  function setBalance(
    address account,
    uint256 balance
  )
    external
  {
    require(
      account != address(0),
      "ERC20Mock#1"
    );

    uint256 diff;

    if (balance > balanceOf[account]) {
      diff = balance.sub(balanceOf[account]);

      totalSupply = totalSupply.add(diff);
      balanceOf[account] = balanceOf[account].add(diff);

      emit Transfer(
        address(0),
        account,
          diff
      );
    } else {
      diff = balanceOf[account].sub(balance);

      totalSupply = totalSupply.sub(diff);
      balanceOf[account] = balanceOf[account].sub(diff);

      emit Transfer(
        account,
        address(0),
        diff
      );
    }
  }

  function transfer(
    address recipient,
    uint256 amount
  )
    external
    override
    returns (bool)
  {
    _transfer(msg.sender, recipient, amount);

    return true;
  }

  function approve(
    address spender,
    uint256 amount
  )
    external
    override
    returns (bool)
  {
    _approve(msg.sender, spender, amount);

    return true;
  }

  function transferFrom(
    address sender,
    address recipient,
    uint256 amount
  )
    external
    override
    returns (bool)
  {
    _transfer(sender, recipient, amount);

    require(
      allowance[sender][msg.sender] >= amount,
      "ERC20Mock#2"
    );

    _approve(
      sender,
      msg.sender,
      allowance[sender][msg.sender].sub(amount)
    );

    return true;
  }

  // private functions

  function _transfer(
    address sender,
    address recipient,
    uint256 amount
  )
    private
  {
    require(
      sender != address(0),
      "ERC20Mock#3"
    );

    require(
      recipient != address(0),
      "ERC20Mock#4"
    );

    require(
      balanceOf[sender] >= amount,
      "ERC20Mock#5"
    );

    balanceOf[sender] = balanceOf[sender].sub(amount);
    balanceOf[recipient] = balanceOf[recipient].add(amount);

    emit Transfer(
      sender,
      recipient,
      amount
    );
  }

  function _approve(
    address owner,
    address spender,
    uint256 amount
  )
    private
  {
    require(
      owner != address(0),
      "ERC20Mock#6"
    );

    require(
      spender != address(0),
      "ERC20Mock#7"
    );

    allowance[owner][spender] = amount;

    emit Approval(
      owner,
      spender,
      amount
    );
  }
}
