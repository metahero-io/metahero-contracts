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
  }

  struct Summary {
    uint256 totalExcluded;
    uint256 totalHolding;
    uint256 totalRewards;
    uint256 totalSupply;
  }

  struct ExcludedAccount {
    bool exists;
    bool excludeRecipientFromFee;
  }

  // defaults
  uint256 private constant DEFAULT_TOTAL_SUPPLY = 10000000000 * 10 ** 9; // 10,000,000,000.000000000

  Settings public settings;
  Summary public summary;
  bool public presaleFinished;

  mapping (address => uint256) internal accountBalances;
  mapping (address => mapping (address => uint256)) private accountAllowances;
  mapping (address => ExcludedAccount) private excludedAccounts;

  // events

  event PresaleFinished();

  event AccountExcluded(
    address indexed account,
    bool excludeRecipientFromFee
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
      !presaleFinished,
      "HEROTokenEconomy: presale already finished"
    );

    presaleFinished = true;

    emit PresaleFinished();
  }

  function excludeAccount(
    address account,
    bool excludeRecipientFromFee
  )
    external
    onlyController
  {
    _excludeAccount(
      account,
      excludeRecipientFromFee
    );
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

    uint256 allowance = accountAllowances[sender][msg.sender];

    require(
      allowance >= amount,
      "HEROTokenEconomy: amount exceeds allowance"
    );

    _approve(
      sender,
      msg.sender,
      allowance.sub(amount)
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
    return accountAllowances[owner][spender];
  }

  function balanceOf(
    address account
  )
    external
    view
    override
    returns (uint256 result)
  {
    result = accountBalances[account];

    if (
      !excludedAccounts[account].exists &&
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
    uint256 totalSupply_,
    address[] calldata excludedAccounts_
  )
    internal
  {
    settings = Settings(
      lpFees,
      rewardsFees
    );

    _mint(
      msg.sender,
      totalSupply_ == 0
      ? DEFAULT_TOTAL_SUPPLY
      : totalSupply_
    );

    _excludeAccount(address(this), false);

    uint256 excludedAccountsLen = excludedAccounts_.length;

    for (uint256 index = 0; index < excludedAccountsLen; index += 1) {
      _excludeAccount(excludedAccounts_[index], false);
    }
  }

  function _excludeAccount(
    address account,
    bool excludeRecipientFromFee
  )
    internal
  {
    require(
      account != address(0),
      "HEROTokenEconomy: account is the zero address"
    );

    if (excludedAccounts[account].exists) {
      require(
        excludedAccounts[account].excludeRecipientFromFee != excludeRecipientFromFee,
        "HEROTokenEconomy: account already exists"
      );

      excludedAccounts[account].excludeRecipientFromFee = excludeRecipientFromFee;
    } else {
      require(
        accountBalances[account] == 0,
        "HEROTokenEconomy: can not exclude holder account"
      );

      excludedAccounts[account].exists = true;
      excludedAccounts[account].excludeRecipientFromFee = excludeRecipientFromFee;
    }

    emit AccountExcluded(
      account,
      excludeRecipientFromFee
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

    accountAllowances[owner][spender] = amount;

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

    _excludeAccount(account, false);

    summary.totalSupply = summary.totalSupply.add(amount);
    summary.totalExcluded = summary.totalExcluded.add(amount);

    accountBalances[account] = accountBalances[account].add(amount);

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
      accountBalances[account] >= amount,
      "HEROTokenEconomy: amount exceeds balance"
    );

    require(
      excludedAccounts[account].exists,
      "HEROTokenEconomy: can not burn from holder account"
    );

    summary.totalSupply = summary.totalSupply.sub(amount);
    summary.totalExcluded = summary.totalExcluded.sub(amount);

    accountBalances[account] = accountBalances[account].sub(amount);

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
      excludedAccounts[sender].exists ||
      presaleFinished,
      "HEROTokenEconomy: locked for presale"
    );

    if (
      !excludedAccounts[sender].exists &&
      !excludedAccounts[recipient].exists
    ) {
      _transferBetweenHolderAccounts(
        sender,
        recipient,
        amount
      );
    } else if (
      excludedAccounts[sender].exists &&
      !excludedAccounts[recipient].exists
    ) {
      _transferFromExcludedAccount(
        sender,
        recipient,
        amount
      );
    } else if (
      !excludedAccounts[sender].exists &&
      excludedAccounts[recipient].exists
    ) {
      _transferToExcludedAccount(
        sender,
        recipient,
        amount
      );
    } else {
      _transferBetweenExcludedAccounts(
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

  function _transferBetweenHolderAccounts(
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
      accountBalances[sender] >= senderAmount,
      "HEROTokenEconomy: amount exceeds balance"
    );

    accountBalances[sender] = accountBalances[sender].sub(senderAmount);
    accountBalances[recipient] = accountBalances[recipient].add(recipientAmount);

    summary.totalHolding = summary.totalHolding.sub(totalFee);

    if (lpFee != 0) {
      _increaseTotalLP(lpFee);
    }

    _updateTotalRewards();
  }

  function _transferFromExcludedAccount(
    address sender,
    address recipient,
    uint256 amount
  )
    internal
  {
    require(
      accountBalances[sender] >= amount,
      "HEROTokenEconomy: amount exceeds balance"
    );

    uint256 recipientFee;
    uint256 lpFee;

    if (!excludedAccounts[sender].excludeRecipientFromFee) {
      (
        recipientFee,
        lpFee
      ) = _calcTransferSenderFees(amount);
    }

    uint256 recipientAmount = amount.sub(recipientFee);

    accountBalances[sender] = accountBalances[sender].sub(amount);
    accountBalances[recipient] = accountBalances[recipient].add(recipientAmount);

    summary.totalExcluded = summary.totalExcluded.sub(amount);
    summary.totalHolding = summary.totalHolding.add(recipientAmount);

    if (lpFee != 0) {
      _increaseTotalLP(lpFee);
    }

    _updateTotalRewards();
  }

  function _transferToExcludedAccount(
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
      accountBalances[sender] >= senderAmount,
      "HEROTokenEconomy: amount exceeds balance"
    );

    accountBalances[sender] = accountBalances[sender].sub(senderAmount);
    accountBalances[recipient] = accountBalances[recipient].add(amount);

    summary.totalExcluded = summary.totalExcluded.add(amount);
    summary.totalHolding = summary.totalHolding.sub(senderAmount);

    if (lpFee != 0) {
      _increaseTotalLP(lpFee);
    }

    _updateTotalRewards();
  }

  function _transferBetweenExcludedAccounts(
    address sender,
    address recipient,
    uint256 amount
  )
    internal
  {
    require(
      accountBalances[sender] >= amount,
      "HEROTokenEconomy: amount exceeds balance"
    );

    accountBalances[sender] = accountBalances[sender].sub(amount);
    accountBalances[recipient] = accountBalances[recipient].add(amount);
  }

  function _increaseTotalLP(
    uint256 amount
  )
    internal
    virtual
  {
    accountBalances[address(this)] = accountBalances[address(this)].add(amount);
    summary.totalExcluded = summary.totalExcluded.add(amount);
  }

  // private functions

  function _updateTotalRewards()
    private
  {
    summary.totalRewards = summary.totalSupply
    .sub(summary.totalExcluded)
    .sub(summary.totalHolding);
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
      !excludedAccounts[account].exists &&
      summary.totalRewards != 0
    ) {
      result = summary.totalRewards
        .mul(accountBalances[account])
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
