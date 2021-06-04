// SPDX-License-Identifier: MIT
pragma solidity ^0.6.12;
pragma experimental ABIEncoderV2;

import "./components/erc20/ERC20.sol";
import "./components/erc20/ERC20Metadata.sol";
import "./components/Controlled.sol";
import "./components/Initializable.sol";
import "./components/Lockable.sol";
import "./libs/MathLib.sol";


/**
 * @title HERO Token
 */
contract HEROToken is ERC20, ERC20Metadata, Controlled, Initializable, Lockable {
  using MathLib for uint256;

  struct Fee {
    uint256 sender; // percent
    uint256 recipient; // percent
  }

  struct Settings {
    Fee lpFee;
    Fee rewardsFee;
    uint256 cycleLength;
    uint256 cycleWeightGain; // percent
  }

  struct Summary {
    uint256 cycleId;
    uint256 baseWeight;
    uint256 totalHolding;
    uint256 totalLp;
    uint256 totalRewards;
    uint256 totalSupply;
  }

  struct Holder {
    uint256 cycleId;
    mapping (address => uint256) allowances;
    uint256 balance;
    bool excluded;
  }

  uint256 public firstCycleTimestamp;

  // metadata
  string private constant NAME = "METAHERO";
  string private constant SYMBOL = "HERO";
  uint8 private constant DECIMALS = 9; // 0.000000000

  // defaults
  uint256 private constant DEFAULT_CYCLE_LENGTH = 24 * 60 * 60; // 24h
  uint256 private constant DEFAULT_CYCLE_WEIGHT_GAIN = 1; // 1%
  uint256 private constant DEFAULT_TOTAL_SUPPLY = 10000000000 * 10 ** 9; // 10,000,000,000.000000000

  Settings private settings;
  Summary private summary;

  mapping (address => Holder) private holders;

  /**
   * @dev Public constructor
   */
  constructor ()
    public
    Controlled()
    Initializable()
    ERC20Metadata(
      Metadata(NAME, SYMBOL, DECIMALS)
    )
  {
    //
  }

  // external functions
  function initialize(
    Fee calldata lpFee,
    Fee calldata rewardsFee,
    uint256 cycleLength,
    uint256 cycleWeightGain,
    uint256 totalSupply_,
    address[] calldata excludedHolders
  )
    external
    onlyInitializer
  {
    firstCycleTimestamp = block.timestamp;

    settings = Settings(
      lpFee,
      rewardsFee,
      cycleLength == 0
        ? DEFAULT_CYCLE_LENGTH
        : cycleLength,
      cycleWeightGain == 0
        ? DEFAULT_CYCLE_WEIGHT_GAIN
        : cycleWeightGain
    );

    _mint(
      msg.sender,
      totalSupply_ == 0
        ? DEFAULT_TOTAL_SUPPLY
        : totalSupply_
    );

    {
      uint256 excludedHoldersLen = excludedHolders.length;

      for (uint256 index = 0; index < excludedHoldersLen; index += 1) {
        holders[excludedHolders[index]].excluded = true;
      }
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
    _transfer(
      msg.sender,
      recipient,
      amount
    );

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

    uint256 currentAllowance = holders[sender].allowances[msg.sender];

    require(
      currentAllowance >= amount,
      "HEROToken: transfer amount exceeds allowance"
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
    return holders[owner].allowances[spender];
  }

  function balanceOf(
    address account
  )
    external
    view
    override
    returns (uint256)
  {
    return _calcHolderBalanceAtCycle(
      account,
      _calcCurrentCycleId()
    );
  }

  // private functions

  function _mint(
    address holder,
    uint256 amount
  )
    private
    lock
  {
    require(
      holder != address(0),
      "HEROToken: invalid holder address"
    );

    require(
      amount > 0,
      "HEROToken: invalid amount"
    );

    summary.totalSupply = summary.totalSupply.add(amount);

    holders[holder].balance = amount;
    holders[holder].excluded = true;

    emit Transfer(
      address(0),
      holder,
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
      "HEROToken: approve from the zero address"
    );

    require(
      spender != address(0),
      "HEROToken: approve to the zero address"
    );

    holders[owner].allowances[spender] = amount;

    emit Approval(
      owner,
      spender,
      amount
    );
  }

  function _transfer(
    address sender,
    address recipient,
    uint256 amount
  )
    private
    lock
  {
    require(
      sender != address(0),
      "HEROToken: transfer from the zero address"
    );

    require(
      recipient != address(0),
      "HEROToken: transfer to the zero address"
    );

    require(
      amount != 0,
      "HEROToken: invalid amount"
    );

    uint256 cycleId = _calcCurrentCycleId();

    if (summary.cycleId != cycleId) {
      summary.baseWeight = _calcBaseWeightBetweenCycles(
        summary.cycleId,
        cycleId,
        summary.totalHolding
      );

      summary.cycleId = cycleId;
    }

    if (
      !holders[sender].excluded &&
      !holders[recipient].excluded
    ) {
      _transferAtCycle(
        sender,
        recipient,
        amount,
        cycleId
      );
    } else if (
      holders[sender].excluded &&
      !holders[recipient].excluded
    ) {
      _transferFromExcluded(
        sender,
        recipient,
        amount
      );
    } else if (
      !holders[sender].excluded &&
      !holders[recipient].excluded
    ) {
      _transferToExcludedAtCycle(
        sender,
        recipient,
        amount,
        cycleId
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

  function _transferAtCycle(
    address sender,
    address recipient,
    uint256 amount,
    uint256 cycleId
  )
    private
  {
    (
      uint256 senderFee,
      uint256 lpFee,
      uint256 rewardsFee
    ) = _calcTransferSenderFees(amount);

    uint256 recipientFee;

    {
      uint256 recipientLpFee;
      uint256 recipientRewardsFee;

      (
        recipientFee,
        recipientLpFee,
        recipientRewardsFee
      ) = _calcTransferSenderFees(amount);

      lpFee = lpFee.add(recipientLpFee);
      rewardsFee = rewardsFee.add(recipientRewardsFee);
    }


    summary.totalLp = summary.totalLp.add(lpFee);
    summary.totalRewards = summary.totalRewards.add(rewardsFee);
  }

  function _transferFromExcluded(
    address sender,
    address recipient,
    uint256 amount
  )
    private
  {
    require(
      holders[sender].balance >= amount,
      "HEROToken: transfer amount exceeds balance"
    );

    (
      uint256 recipientFee,
      uint256 lpFee,
      uint256 rewardsFee
    ) = _calcTransferSenderFees(amount);

    uint256 amountWithoutFee = amount.sub(recipientFee);

    summary.totalHolding = summary.totalHolding.add(amountWithoutFee);
    summary.totalLp = summary.totalLp.add(lpFee);
    summary.totalRewards = summary.totalRewards.add(rewardsFee);

    holders[sender].balance = holders[sender].balance.sub(amount);
    holders[recipient].balance = holders[recipient].balance.add(amountWithoutFee);
  }


  function _transferToExcludedAtCycle(
    address sender,
    address recipient,
    uint256 amount,
    uint256 cycleId
  )
    private
  {

  }

  function _transferBetweenExcluded(
    address sender,
    address recipient,
    uint256 amount
  )
    private
  {
    require(
      holders[sender].balance >= amount,
      "HEROToken: transfer amount exceeds balance"
    );

    holders[sender].balance = holders[sender].balance.sub(amount);
    holders[recipient].balance = holders[recipient].balance.add(amount);
  }


  // private functions (views)

  function _calcTransferSenderFees(
    uint256 amount
  )
    private
    view
    returns (
      uint256 totalFee,
      uint256 lpFee,
      uint256 rewardsFee
    )
  {
    lpFee = amount.percent(settings.lpFee.sender);
    rewardsFee = amount.percent(settings.rewardsFee.sender);

    totalFee = lpFee.add(rewardsFee);

    return (totalFee, lpFee, rewardsFee);
  }

  function _calcTransferRecipientFees(
    uint256 amount
  )
    private
    view
    returns (
      uint256 totalFee,
      uint256 lpFee,
      uint256 rewardsFee
    )
  {
    lpFee = amount.percent(settings.lpFee.recipient);
    rewardsFee = amount.percent(settings.rewardsFee.recipient);

    totalFee = lpFee.add(rewardsFee);

    return (totalFee, lpFee, rewardsFee);
  }

  function _calcHolderBalanceAtCycle(
    address holder,
    uint256 cycleId
  )
    private
    view
    returns (uint256 result)
  {
    result = holders[holder].balance;

    if (
      result != 0 &&
      summary.totalRewards != 0 &&
      !holders[holder].excluded
    ) {
      uint256 holderWeight = holders[holder].balance.add(
        _calcBaseWeightBetweenCycles(
          holders[holder].cycleId,
          cycleId,
          holders[holder].balance
        )
      );

      uint256 holdersWeight = summary.totalHolding.add(
        summary.baseWeight.add(
          _calcBaseWeightBetweenCycles(
            summary.cycleId,
            cycleId,
            summary.totalHolding
          )
        )
      );

      result = result.add(
        summary
        .totalRewards
        .mul(holderWeight)
        .div(holdersWeight)
      );
    }

    return result;
  }

  function _calcBaseWeightBetweenCycles(
    uint256 cycleIdFrom,
    uint256 cycleIdTo,
    uint256 balance
  )
    private
    view
    returns (uint256 result)
  {
    if (
      cycleIdTo > cycleIdFrom &&
      settings.cycleWeightGain != 0 &&
      balance != 0
    ) {
      uint256 cyclesCount = cycleIdTo.sub(cycleIdFrom);

      result = balance.percent(
        cyclesCount.mul(settings.cycleWeightGain)
      );
    }

    return result;
  }

  function _calcCurrentCycleId()
    private
    view
    returns (uint256 result)
  {
    if (settings.cycleLength > 0) {
      result = block
      .timestamp
      .sub(firstCycleTimestamp)
      .div(settings.cycleLength);
    }

    return result;
  }
}
