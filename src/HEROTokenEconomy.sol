// SPDX-License-Identifier: MIT
pragma solidity ^0.6.12;
pragma experimental ABIEncoderV2;

import "./components/erc20/ERC20.sol";
import "./components/Controlled.sol";
import "./libs/MathLib.sol";


/**
 * @title HERO token economy module
 */
contract HEROTokenEconomy is ERC20, Controlled {
  using MathLib for uint256;

  struct Fees {
    uint256 sender; // percent
    uint256 recipient; // percent
  }

  struct Settings {
    Fees lpFees;
    Fees rewardsFees;
    bool presale;
  }

  struct Summary {
    uint256 totalExcluded;
    uint256 totalHolding;
    uint256 totalLP;
    uint256 totalRewards;
    uint256 totalSupply;
  }

  // defaults
  uint256 private constant DEFAULT_TOTAL_SUPPLY = 10000000000 * 10 ** 9; // 10,000,000,000.000000000

  Settings public settings;
  Summary public summary;

  mapping (address => uint256) internal balances;
  mapping (address => mapping (address => uint256)) private allowances;
  mapping (address => bool) private excluded;

  // events

  event PresaleFinished();

  event Excluded(
    address indexed account
  );

  /**
   * @dev Internal constructor
   */
  constructor ()
    internal
    Controlled()
  {
    //
  }

  // external functions

  function finishPresale()
    external
    onlyController
  {
    require(
      settings.presale,
      "HEROTokenEconomy: presale already finished"
    );

    settings.presale = false;

    emit PresaleFinished();
  }

  function exclude(
    address account
  )
    external
    onlyController
  {
    _exclude(account);
  }

  function transfer(
    address recipient,
    uint256 amount
  )
    external
    override
    returns (bool)
  {
    _transfer(
      msg.sender,
      recipient,
      amount
    );

    return true;
  }

  function burn(
    uint256 amount
  )
    external
  {
    _burn(
      msg.sender,
      amount
    );
  }

  function approve(
    address spender,
    uint256 amount
  )
    external
    override
    returns (bool)
  {
    _approve(
      msg.sender,
      spender,
      amount
    );

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
    _transfer(
      sender,
      recipient,
      amount
    );

    uint256 currentAllowance = allowances[sender][msg.sender];

    require(
      currentAllowance >= amount,
      "HEROTokenEconomy: amount exceeds allowance"
    );

    _approve(
      sender,
      msg.sender,
      currentAllowance.sub(amount)
    );

    return true;
  }

  // external functions (views)

  function totalSupply()
    external
    view
    override
    returns (uint256)
  {
    return summary.totalSupply;
  }

  function allowance(
    address owner,
    address spender
  )
    external
    view
    override
    returns (uint256)
  {
    return allowances[owner][spender];
  }

  function balanceOf(
    address account
  )
    external
    view
    override
    returns (uint256 result)
  {
    result = balances[account];

    if (
      !excluded[account] &&
      summary.totalRewards != 0
    ) {
      result = result.add(
        summary.totalRewards
        .mul(result)
        .div(summary.totalHolding)
      );
    }


    return result;
  }

  // internal functions

  function _initializeEconomy(
    Fees memory lpFees,
    Fees memory rewardsFees,
    bool presale,
    uint256 totalSupply_,
    address[] calldata excluded_
  )
    internal
  {
    settings = Settings(
      lpFees,
      rewardsFees,
      presale
    );

    _mint(
      msg.sender,
      totalSupply_ == 0
      ? DEFAULT_TOTAL_SUPPLY
      : totalSupply_
    );

    {
      uint256 excludedLen = excluded_.length;

      for (uint256 index = 0; index < excludedLen; index += 1) {
        _exclude(excluded_[index]);
      }
    }
  }

  function _exclude(
    address account
  )
    internal
  {
    require(
      account != address(0),
      "HEROTokenEconomy: account is the zero address"
    );

    require(
      !excluded[account],
      "HEROTokenEconomy: account already excluded"
    );

    require(
      balances[account] == 0,
      "HEROTokenEconomy: can not exclude holder account"
    );

    excluded[account] = true;

    emit Excluded(
      account
    );
  }

  function _approve(
    address owner,
    address spender,
    uint256 amount
  )
    internal
  {
    require(
      owner != address(0),
      "HEROTokenEconomy: owner is the zero address"
    );

    require(
      spender != address(0),
      "HEROTokenEconomy: spender is the zero address"
    );

    allowances[owner][spender] = amount;

    emit Approval(
      owner,
      spender,
      amount
    );
  }

  function _mint(
    address account,
    uint256 amount
  )
    internal
  {
    require(
      account != address(0),
      "HEROTokenEconomy: account is the zero address"
    );

    require(
      amount != 0,
      "HEROTokenEconomy: invalid amount"
    );

    summary.totalSupply = summary.totalSupply.add(amount);
    summary.totalExcluded = summary.totalExcluded.add(amount);

    _exclude(account);

    balances[account] = balances[account].add(amount);

    emit Transfer(
      address(0),
      account,
      amount
    );
  }

  function _burn(
    address account,
    uint256 amount
  )
    internal
  {
    require(
      account != address(0),
      "HEROTokenEconomy: account is the zero address"
    );

    require(
      amount != 0,
      "HEROTokenEconomy: invalid amount"
    );

    require(
      balances[account] >= amount,
      "HEROTokenEconomy: amount exceeds balance"
    );

    require(
      excluded[account],
      "HEROTokenEconomy: can not burn from holder account"
    );

    summary.totalSupply = summary.totalSupply.sub(amount);
    summary.totalExcluded = summary.totalExcluded.sub(amount);

    balances[account] = balances[account].sub(amount);

    emit Transfer(
      account,
      address(0),
      amount
    );
  }

  function _transfer(
    address sender,
    address recipient,
    uint256 amount
  )
    internal
  {
    require(
      sender != address(0),
      "HEROTokenEconomy: sender is the zero address"
    );

    require(
      recipient != address(0),
      "HEROTokenEconomy: recipient is the zero address"
    );

    require(
      sender != recipient,
      "HEROTokenEconomy: invalid recipient"
    );

    require(
      amount != 0,
      "HEROTokenEconomy: invalid amount"
    );

    require(
      excluded[sender] || !settings.presale,
      "HEROTokenEconomy: locked for presale"
    );

    if (
      !excluded[sender] && !excluded[recipient]
    ) {
      _transferBetweenHolders(
        sender,
        recipient,
        amount
      );
    } else if (
      excluded[sender] && !excluded[recipient]
    ) {
      _transferFromExcluded(
        sender,
        recipient,
        amount
      );
    } else if (
      !excluded[sender] && excluded[recipient]
    ) {
      _transferToExcluded(
        sender,
        recipient,
        amount
      );
    } else {
      _transferBetweenExcluded(
        sender,
        recipient,
        amount
      );
    }

    emit Transfer(
      sender,
      recipient,
      amount
    );
  }

  function _transferBetweenHolders(
    address sender,
    address recipient,
    uint256 amount
  )
    internal
  {
    (
      uint256 senderFee,
      uint256 lpFee
    ) = _calcTransferSenderFees(amount);

    uint256 recipientFee;
    uint256 totalFee = senderFee;

    {
      uint256 recipientLPFee;

      (
        recipientFee,
        recipientLPFee
      ) = _calcTransferRecipientFees(amount);

      lpFee = lpFee.add(recipientLPFee);
      totalFee = totalFee.add(recipientFee);
    }

    uint256 senderAmount = amount.add(senderFee);
    uint256 recipientAmount = amount.sub(recipientFee);

    if (summary.totalRewards != 0) {
      uint256 totalHoldingWithRewards = summary.totalHolding.add(
        summary.totalRewards
      );

      senderAmount = senderAmount.mul(summary.totalHolding).div(
        totalHoldingWithRewards
      );
      recipientAmount = recipientAmount.mul(summary.totalHolding).div(
        totalHoldingWithRewards
      );
      totalFee = totalFee.mul(summary.totalHolding).div(
        totalHoldingWithRewards
      );
    }

    require(
      balances[sender] >= senderAmount,
      "HEROTokenEconomy: amount exceeds balance"
    );

    balances[sender] = balances[sender].sub(senderAmount);
    balances[recipient] = balances[recipient].add(recipientAmount);

    summary.totalHolding = summary.totalHolding.sub(totalFee);

    _increaseTotalLP(lpFee);
    _updateTotalRewards();
  }

  function _transferFromExcluded(
    address sender,
    address recipient,
    uint256 amount
  )
    internal
  {
    require(
      balances[sender] >= amount,
      "HEROTokenEconomy: amount exceeds balance"
    );

    (
      uint256 recipientFee,
      uint256 lpFee
    ) = _calcTransferSenderFees(amount);

    uint256 recipientAmount = amount.sub(recipientFee);

    balances[sender] = balances[sender].sub(amount);
    balances[recipient] = balances[recipient].add(recipientAmount);

    summary.totalExcluded = summary.totalExcluded.sub(amount);
    summary.totalHolding = summary.totalHolding.add(recipientAmount);

    _increaseTotalLP(lpFee);
    _updateTotalRewards();
  }

  function _transferToExcluded(
    address sender,
    address recipient,
    uint256 amount
  )
    internal
  {
    (
      uint256 senderFee,
      uint256 lpFee
    ) = _calcTransferSenderFees(amount);

    uint256 senderAmount = amount.add(senderFee);

    if (summary.totalRewards != 0) {
      uint256 totalHoldingWithRewards = summary.totalHolding.add(
        summary.totalRewards
      );

      senderAmount = senderAmount.mul(summary.totalHolding).div(
        totalHoldingWithRewards
      );
    }

    require(
      balances[sender] >= senderAmount,
      "HEROTokenEconomy: amount exceeds balance"
    );

    balances[sender] = balances[sender].sub(senderAmount);
    balances[recipient] = balances[recipient].add(amount);

    summary.totalExcluded = summary.totalExcluded.add(amount);
    summary.totalHolding = summary.totalHolding.sub(senderAmount);

    _increaseTotalLP(lpFee);
    _updateTotalRewards();
  }

  function _transferBetweenExcluded(
    address sender,
    address recipient,
    uint256 amount
  )
    internal
  {
    require(
      balances[sender] >= amount,
      "HEROTokenEconomy: amount exceeds balance"
    );

    balances[sender] = balances[sender].sub(amount);
    balances[recipient] = balances[recipient].add(amount);
  }

  function _increaseTotalLP(
    uint256 amount
  )
    internal
    virtual
  {
    summary.totalLP = summary.totalLP.add(amount);
  }

  // private functions

  function _updateTotalRewards()
    private
  {
    summary.totalRewards = summary.totalSupply
    .sub(summary.totalExcluded)
    .sub(summary.totalHolding)
    .sub(summary.totalLP);
  }

  // private functions (views)

  function _calcRewards(
    address account
  )
    private
    view
    returns (uint256 result)
  {
    if (
      !excluded[account] &&
      summary.totalRewards != 0
    ) {
      result = summary.totalRewards
        .mul(balances[account])
        .div(summary.totalHolding);
    }

    return result;
  }

  function _calcTransferSenderFees(
    uint256 amount
  )
    private
    view
    returns (
      uint256 totalFee,
      uint256 lpFee
    )
  {
    uint256 rewardsFee = amount.percent(settings.rewardsFees.sender);

    lpFee = amount.percent(settings.lpFees.sender);
    totalFee = lpFee.add(rewardsFee);

    return (totalFee, lpFee);
  }

  function _calcTransferRecipientFees(
    uint256 amount
  )
    private
    view
    returns (
      uint256 totalFee,
      uint256 lpFee
    )
  {
    uint256 rewardsFee = amount.percent(settings.rewardsFees.recipient);

    lpFee = amount.percent(settings.lpFees.recipient);
    totalFee = lpFee.add(rewardsFee);

    return (totalFee, lpFee);
  }
}
