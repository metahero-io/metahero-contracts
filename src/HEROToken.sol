// SPDX-License-Identifier: MIT
pragma solidity ^0.6.12;
pragma experimental ABIEncoderV2;

import "./access/Controlled.sol";
import "./access/Owned.sol";
import "./erc20/ERC20.sol";
import "./lifecycle/Initializable.sol";
import "./libs/MathLib.sol";
import "./HEROLPManager.sol";


/**
 * @title HERO token
 */
contract HEROToken is Controlled, Owned, ERC20, Initializable {
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

  // metadata

  string private constant TOKEN_NAME = "Metahero";
  string private constant TOKEN_SYMBOL = "HERO";
  uint8 private constant TOKEN_DECIMALS = 18; // 0.000000000000000000

  HEROLPManager public lpManager;
  Settings public settings;
  Summary public summary;
  bool public presaleFinished;

  mapping (address => uint256) private accountBalances;
  mapping (address => mapping (address => uint256)) private accountAllowances;
  mapping (address => ExcludedAccount) private excludedAccounts;

  // events

  event PresaleFinished();

  event AccountExcluded(
    address indexed account,
    bool excludeRecipientFromFee
  );

  /**
   * @dev Public constructor
   */
  constructor ()
    public
    Controlled()
    Owned()
    ERC20(TOKEN_NAME, TOKEN_SYMBOL, TOKEN_DECIMALS)
    Initializable()
  {
    //
  }

  // external functions

  function initialize(
    Fees memory lpFees,
    Fees memory rewardsFees,
    address payable lpManager_,
    address controller_,
    uint256 totalSupply_,
    address[] calldata excludedAccounts_
  )
    external
    onlyInitializer
  {
    settings.lpFees = lpFees;
    settings.rewardsFees = rewardsFees;

    if (
      lpFees.sender != 0 ||
      lpFees.recipient != 0
    ) {
      require(
        lpManager_ != address(0),
        "HEROToken#1"
      );

      lpManager = HEROLPManager(lpManager_);

      _excludeAccount(lpManager_, false);
    }

    _initializeController(controller_);

    if (totalSupply_ != 0) {
      _excludeAccount(msg.sender, false);

      _mint(
        msg.sender,
        totalSupply_
      );
    }

    uint256 excludedAccountsLen = excludedAccounts_.length;

    for (uint256 index; index < excludedAccountsLen; index++) {
      _excludeAccount(excludedAccounts_[index], false);
    }
  }

  function finishPresale()
    external
    onlyOwner
  {
    require(
      !presaleFinished,
      "HEROToken#2"
    );

    presaleFinished = true;

    emit PresaleFinished();
  }

  function excludeAccount(
    address account,
    bool excludeRecipientFromFee
  )
    external
    onlyOwner
  {
    _excludeAccount(
      account,
      excludeRecipientFromFee
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

  function mint(
    address account,
    uint256 amount
  )
    external
    onlyController
  {
    _mint(
      account,
      amount
    );
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
      "HEROToken#3"
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
    result = accountBalances[account].add(
      _calcRewards(account)
    );

    return result;
  }

  function getBalanceSummary(
    address account
  )
    external
    view
    returns (
      uint256 totalBalance,
      uint256 holdingBalance,
      uint256 totalRewards
    )
  {
    holdingBalance = accountBalances[account];
    totalRewards = _calcRewards(account);
    totalBalance = holdingBalance.add(totalRewards);

    return (totalBalance, holdingBalance, totalRewards);
  }

  // private functions

  function _excludeAccount(
    address account,
    bool excludeRecipientFromFee
  )
    private
  {
    require(
      account != address(0),
      "HEROToken#4"
    );

    if (excludedAccounts[account].exists) {
      require(
        excludedAccounts[account].excludeRecipientFromFee != excludeRecipientFromFee,
        "HEROToken#5"
      );

      excludedAccounts[account].excludeRecipientFromFee = excludeRecipientFromFee;
    } else {
      require(
        accountBalances[account] == 0,
        "HEROToken#6"
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
    private
  {
    require(
      owner != address(0),
      "HEROToken#7"
    );

    require(
      spender != address(0),
      "HEROToken#8"
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
    private
  {
    require(
      account != address(0),
      "HEROToken#9"
    );

    require(
      amount != 0,
      "HEROToken#10"
    );

    summary.totalSupply = summary.totalSupply.add(amount);

    if (excludedAccounts[account].exists) {
      summary.totalExcluded = summary.totalExcluded.add(amount);
    } else {
      summary.totalHolding = summary.totalHolding.add(amount);

      _updateTotalRewards();
    }

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
    private
  {
    require(
      account != address(0),
      "HEROToken#11"
    );

    require(
      amount != 0,
      "HEROToken#12"
    );

    require(
      accountBalances[account] >= amount,
      "HEROToken#13"
    );

    summary.totalSupply = summary.totalSupply.sub(amount);

    if (excludedAccounts[account].exists) {
      summary.totalExcluded = summary.totalExcluded.sub(amount);
    } else {
      summary.totalHolding = summary.totalHolding.sub(amount);

      _updateTotalRewards();
    }

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
    private
  {
    require(
      sender != address(0),
      "HEROToken#14"
    );

    require(
      recipient != address(0),
      "HEROToken#15"
    );

    require(
      sender != recipient,
      "HEROToken#16"
    );

    require(
      amount != 0,
      "HEROToken#17"
    );

    require(
      excludedAccounts[sender].exists ||
      presaleFinished,
      "HEROToken#18"
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
    private
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
      "HEROToken#19"
    );

    accountBalances[sender] = accountBalances[sender].sub(senderAmount);
    accountBalances[recipient] = accountBalances[recipient].add(recipientAmount);

    summary.totalHolding = summary.totalHolding.sub(totalFee);

    _increaseTotalLP(lpFee);

    _updateTotalRewards();
  }

  function _transferFromExcludedAccount(
    address sender,
    address recipient,
    uint256 amount
  )
    private
  {
    require(
      accountBalances[sender] >= amount,
      "HEROToken#20"
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

    _increaseTotalLP(lpFee);

    _updateTotalRewards();
  }

  function _transferToExcludedAccount(
    address sender,
    address recipient,
    uint256 amount
  )
    private
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
      "HEROToken#21"
    );

    accountBalances[sender] = accountBalances[sender].sub(senderAmount);
    accountBalances[recipient] = accountBalances[recipient].add(amount);

    summary.totalExcluded = summary.totalExcluded.add(amount);
    summary.totalHolding = summary.totalHolding.sub(senderAmount);

    _increaseTotalLP(lpFee);

    _updateTotalRewards();
  }

  function _transferBetweenExcludedAccounts(
    address sender,
    address recipient,
    uint256 amount
  )
    private
  {
    require(
      accountBalances[sender] >= amount,
      "HEROToken#22"
    );

    accountBalances[sender] = accountBalances[sender].sub(amount);
    accountBalances[recipient] = accountBalances[recipient].add(amount);
  }

  function _increaseTotalLP(
    uint256 amount
  )
    private
  {
    if (amount != 0) {
      accountBalances[address(lpManager)] = accountBalances[address(lpManager)].add(amount);

      summary.totalExcluded = summary.totalExcluded.add(amount);

      lpManager.syncLP();
    }
  }

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
