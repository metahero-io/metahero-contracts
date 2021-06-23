// SPDX-License-Identifier: MIT
pragma solidity ^0.6.12;
pragma experimental ABIEncoderV2;

import "./access/Controlled.sol";
import "./access/Owned.sol";
import "./erc20/ERC20.sol";
import "./lifecycle/Initializable.sol";
import "./math/MathLib.sol";
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
    Fees burnFees;
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
    bool excludeSenderFromFee;
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
    bool excludeSenderFromFee,
    bool excludeRecipientFromFee
  );

  event TotalRewardsUpdated(
    uint256 totalRewards
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
    Fees memory burnFees,
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
    settings.burnFees = burnFees;
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

      _excludeAccount(lpManager_, false, false);
    }

    _initializeController(controller_);

    if (totalSupply_ != 0) {
      _excludeAccount(msg.sender, true, true);

      _mint(
        msg.sender,
        totalSupply_
      );
    }

    uint256 excludedAccountsLen = excludedAccounts_.length;

    for (uint256 index; index < excludedAccountsLen; index++) {
      _excludeAccount(excludedAccounts_[index], false, false);
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
    bool excludeSenderFromFee,
    bool excludeRecipientFromFee
  )
    external
    onlyOwner
  {
    _excludeAccount(
      account,
      excludeSenderFromFee,
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
    bool excludeSenderFromFee,
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
        excludedAccounts[account].excludeSenderFromFee != excludeSenderFromFee ||
        excludedAccounts[account].excludeRecipientFromFee != excludeRecipientFromFee,
        "HEROToken#5"
      );

      excludedAccounts[account].excludeSenderFromFee = excludeSenderFromFee;
      excludedAccounts[account].excludeRecipientFromFee = excludeRecipientFromFee;
    } else {
      require(
        accountBalances[account] == 0,
        "HEROToken#6"
      );

      excludedAccounts[account].exists = true;
      excludedAccounts[account].excludeSenderFromFee = excludeSenderFromFee;
      excludedAccounts[account].excludeRecipientFromFee = excludeRecipientFromFee;
    }

    emit AccountExcluded(
      account,
      excludeSenderFromFee,
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

    require(
      excludedAccounts[account].exists,
      "HEROToken#11"
    );

    summary.totalSupply = summary.totalSupply.add(amount);
    summary.totalExcluded = summary.totalExcluded.add(amount);

    accountBalances[account] = accountBalances[account].add(amount);

    _emitTransfer(
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
      "HEROToken#12"
    );

    require(
      amount != 0,
      "HEROToken#13"
    );

    require(
      accountBalances[account] >= amount,
      "HEROToken#14"
    );

    require(
      excludedAccounts[account].exists,
      "HEROToken#15"
    );

    accountBalances[account] = accountBalances[account].sub(amount);

    summary.totalSupply = summary.totalSupply.sub(amount);
    summary.totalExcluded = summary.totalExcluded.sub(amount);

    _emitTransfer(
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
      "HEROToken#16"
    );

    require(
      recipient != address(0),
      "HEROToken#17"
    );

    require(
      amount != 0,
      "HEROToken#18"
    );

    require(
      excludedAccounts[sender].exists ||
      presaleFinished,
      "HEROToken#19"
    );

    if (sender == recipient) {
      _syncLP();

      _emitTransfer(
        sender,
        recipient,
        0
      );
    } else if (
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
  }

  function _transferBetweenHolderAccounts(
    address sender,
    address recipient,
    uint256 amount
  )
    private
  {
    uint256 senderAmount;
    uint256 senderBurnFee;
    uint256 senderLpFee;

    uint256 recipientAmount;
    uint256 recipientBurnFee;
    uint256 recipientLpFee;

    uint256 totalFee;

    {
      uint256 senderTotalFee;
      uint256 recipientTotalFee;

      (
        senderTotalFee,
        senderBurnFee,
        senderLpFee
      ) = _calcTransferSenderFees(amount);

      (
        recipientTotalFee,
        recipientBurnFee,
        recipientLpFee
      ) = _calcTransferRecipientFees(amount);

      totalFee = senderTotalFee.add(recipientTotalFee);
      senderAmount = amount.add(senderTotalFee);
      recipientAmount = amount.sub(recipientTotalFee);
    }

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
      "HEROToken#20"
    );

    accountBalances[sender] = accountBalances[sender].sub(senderAmount);
    accountBalances[recipient] = accountBalances[recipient].add(recipientAmount);

    summary.totalSupply = summary.totalSupply.sub(senderBurnFee).sub(recipientBurnFee);
    summary.totalHolding = summary.totalHolding.sub(totalFee);

    _increaseTotalLP(senderLpFee.add(recipientLpFee));

    // emits events

    _emitTransfer(
      sender,
      recipient,
      amount
    );

    _emitTransfer(
      sender,
      address(0),
      senderBurnFee
    );

    _emitTransfer(
      sender,
      address(lpManager),
      senderLpFee
    );

    _emitTransfer(
      recipient,
      address(0),
      recipientBurnFee
    );

    _emitTransfer(
      recipient,
      address(lpManager),
      recipientLpFee
    );

    _updateTotalRewards();

    _syncLP();
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
      "HEROToken#21"
    );

    (
      bool shouldSyncLPBefore,
      bool shouldSyncLPAfter
    ) = _canSyncLP(
      sender,
      address(0)
    );

    if (shouldSyncLPBefore) {
      lpManager.syncLP();
    }

    uint256 recipientTotalFee;
    uint256 recipientBurnFee;
    uint256 recipientLPFee;

    if (!excludedAccounts[sender].excludeRecipientFromFee) {
      (
        recipientTotalFee,
        recipientBurnFee,
        recipientLPFee
      ) = _calcTransferRecipientFees(amount);
    }

    uint256 recipientAmount = amount.sub(recipientTotalFee);

    accountBalances[sender] = accountBalances[sender].sub(amount);
    accountBalances[recipient] = accountBalances[recipient].add(recipientAmount);

    summary.totalSupply = summary.totalSupply.sub(recipientBurnFee);
    summary.totalExcluded = summary.totalExcluded.sub(amount);
    summary.totalHolding = summary.totalHolding.add(recipientAmount);

    _increaseTotalLP(recipientLPFee);

    // emits events

    _emitTransfer(
      sender,
      recipient,
      amount
    );

    _emitTransfer(
      recipient,
      address(0),
      recipientBurnFee
    );

    _emitTransfer(
      recipient,
      address(lpManager),
      recipientLPFee
    );

    _updateTotalRewards();

    if (shouldSyncLPAfter) {
      lpManager.syncLP();
    }
  }

  function _transferToExcludedAccount(
    address sender,
    address recipient,
    uint256 amount
  )
    private
  {
    (
      bool shouldSyncLPBefore,
      bool shouldSyncLPAfter
    ) = _canSyncLP(
      address(0),
      recipient
    );

    if (shouldSyncLPBefore) {
      lpManager.syncLP();
    }

    uint256 senderTotalFee;
    uint256 senderBurnFee;
    uint256 senderLpFee;

    if (!excludedAccounts[recipient].excludeSenderFromFee) {
      (
        senderTotalFee,
        senderBurnFee,
        senderLpFee
      ) = _calcTransferSenderFees(amount);
    }

    uint256 senderAmount = amount.add(senderTotalFee);

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
      "HEROToken#22"
    );

    accountBalances[sender] = accountBalances[sender].sub(senderAmount);
    accountBalances[recipient] = accountBalances[recipient].add(amount);

    summary.totalSupply = summary.totalSupply.sub(senderBurnFee);
    summary.totalExcluded = summary.totalExcluded.add(amount);
    summary.totalHolding = summary.totalHolding.sub(senderAmount);

    _increaseTotalLP(senderLpFee);

    // emits events

    _emitTransfer(
      sender,
      recipient,
      amount
    );

    _emitTransfer(
      sender,
      address(0),
      senderBurnFee
    );

    _emitTransfer(
      sender,
      address(lpManager),
      senderLpFee
    );

    _updateTotalRewards();

    if (shouldSyncLPAfter) {
      lpManager.syncLP();
    }
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
      "HEROToken#23"
    );

    (
      bool shouldSyncLPBefore,
      bool shouldSyncLPAfter
    ) = _canSyncLP(
      address(0),
      recipient
    );

    if (shouldSyncLPBefore) {
      lpManager.syncLP();
    }

    accountBalances[sender] = accountBalances[sender].sub(amount);
    accountBalances[recipient] = accountBalances[recipient].add(amount);

    _emitTransfer(
      sender,
      recipient,
      amount
    );

    if (shouldSyncLPAfter) {
      lpManager.syncLP();
    }
  }

  function _emitTransfer(
    address sender,
    address recipient,
    uint256 amount
  )
    private
  {
    if (amount != 0) {
      emit Transfer(
        sender,
        recipient,
        amount
      );
    }
  }

  function _increaseTotalLP(
    uint256 amount
  )
    private
  {
    if (amount != 0) {
      accountBalances[address(lpManager)] = accountBalances[address(lpManager)].add(amount);

      summary.totalExcluded = summary.totalExcluded.add(amount);
    }
  }

  function _syncLP()
    private
  {
    if (address(lpManager) != address(0)) {
      lpManager.syncLP();
    }
  }

  function _updateTotalRewards()
    private
  {
    uint256 totalRewards = summary.totalSupply
    .sub(summary.totalExcluded)
    .sub(summary.totalHolding);

    if (totalRewards != summary.totalRewards) {
      summary.totalRewards = totalRewards;

      emit TotalRewardsUpdated(
        totalRewards
      );
    }
  }

  // private functions (views)

  function _canSyncLP(
    address sender,
    address recipient
  )
    private
    view
    returns (
      bool shouldSyncLPBefore,
      bool shouldSyncLPAfter
    )
  {
    if (address(lpManager) != address(0)) {
      (shouldSyncLPBefore, shouldSyncLPAfter) = lpManager.canSyncLP(
        sender,
        recipient
      );
    }

    return (shouldSyncLPBefore, shouldSyncLPAfter);
  }

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
      uint256 burnFee,
      uint256 lpFee
    )
  {
    uint256 rewardsFee = amount.percent(settings.rewardsFees.sender);

    lpFee = amount.percent(settings.lpFees.sender);
    burnFee = amount.percent(settings.burnFees.sender);

    totalFee = lpFee.add(rewardsFee).add(burnFee);

    return (totalFee, burnFee, lpFee);
  }

  function _calcTransferRecipientFees(
    uint256 amount
  )
    private
    view
    returns (
      uint256 totalFee,
      uint256 burnFee,
      uint256 lpFee
    )
  {
    uint256 rewardsFee = amount.percent(settings.rewardsFees.recipient);

    lpFee = amount.percent(settings.lpFees.recipient);
    burnFee = amount.percent(settings.burnFees.recipient);

    totalFee = lpFee.add(rewardsFee).add(burnFee);

    return (totalFee, burnFee, lpFee);
  }
}
