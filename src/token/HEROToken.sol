// SPDX-License-Identifier: MIT
pragma solidity ^0.6.12;
pragma experimental ABIEncoderV2;

import "../common/access/Controlled.sol";
import "../common/access/Owned.sol";
import "../common/erc20/ERC20.sol";
import "../common/lifecycle/Initializable.sol";
import "../common/math/MathLib.sol";
import "../common/math/SafeMathLib.sol";
import "../lpManager/HEROLPManager.sol";


/**
 * @title HERO token
 *
 * @author Stanisław Głogowski <stan@metahero.io>
 */
contract HEROToken is Controlled, Owned, ERC20, Initializable {
  using MathLib for uint256;
  using SafeMathLib for uint256;

  struct Fees {
    uint256 sender; // percent
    uint256 recipient; // percent
  }

  struct Settings {
    Fees burnFees;
    Fees lpFees;
    Fees rewardsFees;
    uint256 minTotalSupply;
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
    uint256 minTotalSupply,
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
    settings.minTotalSupply = minTotalSupply;

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

    _excludeAccount(msg.sender, true, true);

    if (totalSupply_ != 0) {
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

    uint256 totalSupply_ = summary.totalSupply.sub(amount);

    if (settings.minTotalSupply != 0) {
      require(
        totalSupply_ >= settings.minTotalSupply,
        "HEROToken#16"
      );
    }

    accountBalances[account] = accountBalances[account].sub(amount);

    summary.totalSupply = totalSupply_;
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
      "HEROToken#17"
    );

    require(
      recipient != address(0),
      "HEROToken#18"
    );

    if (sender == recipient) { // special transfer type
      _syncLP();

      _emitTransfer(
        sender,
        recipient,
        0
      );
    } else {
      require(
        excludedAccounts[sender].exists ||
        presaleFinished,
        "HEROToken#20"
      );

      require(
        amount != 0,
        "HEROToken#19"
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

    uint256 totalSupply_ = summary.totalSupply;
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
        totalSupply_,
        senderTotalFee,
        senderBurnFee
      ) = _matchTotalSupplyWithFees(totalSupply_, senderTotalFee, senderBurnFee);

      (
        recipientTotalFee,
        recipientBurnFee,
        recipientLpFee
      ) = _calcTransferRecipientFees(amount);

      (
        totalSupply_,
        recipientTotalFee,
        recipientBurnFee
      ) = _matchTotalSupplyWithFees(totalSupply_, recipientTotalFee, recipientBurnFee);

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
      "HEROToken#21"
    );

    accountBalances[sender] = accountBalances[sender].sub(senderAmount);
    accountBalances[recipient] = accountBalances[recipient].add(recipientAmount);

    summary.totalSupply = totalSupply_;
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
      "HEROToken#22"
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

    uint256 totalSupply_ = summary.totalSupply;

    if (!excludedAccounts[sender].excludeRecipientFromFee) {
      (
        recipientTotalFee,
        recipientBurnFee,
        recipientLPFee
      ) = _calcTransferRecipientFees(amount);

      (
        totalSupply_,
        recipientTotalFee,
        recipientBurnFee
      ) = _matchTotalSupplyWithFees(totalSupply_, recipientTotalFee, recipientBurnFee);
    }

    uint256 recipientAmount = amount.sub(recipientTotalFee);

    accountBalances[sender] = accountBalances[sender].sub(amount);
    accountBalances[recipient] = accountBalances[recipient].add(recipientAmount);

    summary.totalSupply = totalSupply_;
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

    uint256 totalSupply_ = summary.totalSupply;

    if (!excludedAccounts[recipient].excludeSenderFromFee) {
      (
        senderTotalFee,
        senderBurnFee,
        senderLpFee
      ) = _calcTransferSenderFees(amount);

      (
        totalSupply_,
        senderTotalFee,
        senderBurnFee
      ) = _matchTotalSupplyWithFees(totalSupply_, senderTotalFee, senderBurnFee);
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
      "HEROToken#23"
    );

    accountBalances[sender] = accountBalances[sender].sub(senderAmount);
    accountBalances[recipient] = accountBalances[recipient].add(amount);

    summary.totalSupply = totalSupply_;
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
      "HEROToken#24"
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

  function _matchTotalSupplyWithFees(
    uint256 totalSupply_,
    uint256 totalFee,
    uint256 burnFee
  )
    private
    view
    returns (uint256, uint256, uint256)
  {
    if (burnFee != 0 && settings.minTotalSupply != 0) {
      uint256 newTotalSupply = totalSupply_.sub(burnFee);

      if (newTotalSupply >= settings.minTotalSupply) {
        totalSupply_ = newTotalSupply;
      } else  {
        totalFee = totalFee.sub(burnFee);
        burnFee = 0;
      }
    }

    return (totalSupply_, totalFee, burnFee);
  }

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
