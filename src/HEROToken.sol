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

  struct Tax { // percent
    uint256 sender;
    uint256 recipient;
  }

  struct Settings {
    Tax lpTax;
    Tax rewardsTax;
    uint256 cycleLength;
    uint256 cycleWeightGain; // percent
  }

  struct Summary {
    uint256 cycleId;
    uint256 totalHolders;
    uint256 totalHolding;
    uint256 totalLP;
    uint256 totalRewards;
    uint256 totalSupply;
  }

  struct Holder {
    mapping (address => uint256) allowances;
    uint256 balance;
    uint256 lastTransferCycleId;
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
    Tax calldata lpTax,
    Tax calldata rewardsTax,
    uint256 cycleLength,
    uint256 cycleWeightGain,
    uint256 totalSupply_
  )
    external
    onlyInitializer
  {
    firstCycleTimestamp = block.timestamp;

    settings = Settings(
      lpTax,
      rewardsTax,
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
    amount = _transfer(
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

    require(
      holders[holder].balance == 0 &&
      holders[holder].lastTransferCycleId == 0,
      "HEROToken: can not mint to existing holder"
    );

    summary.totalSupply = summary.totalSupply.add(amount);

    holders[holder].balance = amount;

    emit Transfer(
      address(0),
      holder,
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
    returns (uint256)
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

    uint256 senderCycleBalance = _calcHolderBalanceAtCycle(
      sender,
      cycleId
    );

    uint256 tax;
    uint256 lpTax;
    uint256 rewardsTax;
    uint256 senderTax;
    uint256 recipientTax;

    if (settings.lpTax.sender != 0) {
      tax = amount.percent(settings.lpTax.sender);
      senderTax = tax;
      lpTax = tax;
    }

    if (settings.rewardsTax.sender != 0) {
      tax = amount.percent(settings.rewardsTax.sender);
      senderTax = senderTax.add(tax);
      rewardsTax = tax;
    }

    if (settings.lpTax.recipient != 0) {
      tax = amount.percent(settings.lpTax.recipient);
      recipientTax = tax;
      lpTax = lpTax.add(tax);
    }

    if (settings.rewardsTax.recipient != 0) {
      tax = amount.percent(settings.rewardsTax.recipient);
      recipientTax = recipientTax.add(tax);
      rewardsTax = rewardsTax.add(tax);
    }

    uint256 amountWithSenderTax = amount.add(senderTax);

    require(
      senderCycleBalance >= amountWithSenderTax,
      "HEROToken: transfer amount exceeds balance"
    );

    summary.totalLP = summary.totalLP.add(lpTax);
    summary.totalRewards = summary.totalRewards.add(rewardsTax);

    if (summary.cycleId == cycleId)  {
      //
    } else {
      summary.cycleId = cycleId;
    }

    holders[sender].balance = holders[sender].balance.sub(
      amountWithSenderTax
    );
    holders[recipient].balance = holders[recipient].balance.add(
      recipientTax == 0
      ? amount
      : amount.sub(recipientTax)
    );

    emit Transfer(
      sender,
      recipient,
      amount
    );

    return amount;
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

  // private functions (views)

  function _calcHolderBalanceAtCycle(
    address holder,
    uint256 snapshotId
  )
    private
    view
    returns (uint256 result)
  {
    result = holders[holder].balance;

    if (result > 0) {
      uint256 holderWeight = _calcHolderWeightAtCycle(
        holder,
        snapshotId
      );

      if (holderWeight != 0) {
        uint256 holdersWeight = _calcHoldersWeightAtCycle(
          snapshotId
        );

        if (holdersWeight != 0) {
          result = result.add(
            summary
            .totalRewards
            .mul(holderWeight)
            .div(holdersWeight)
          );
        }
      }
    }

    return result;
  }

  function _calcHolderWeightAtCycle(
    address holder,
    uint256 cycleId
  )
    private
    view
    returns (uint256)
  {
    uint256 result = holders[holder].balance;

    if (
      holders[holder].balance != 0 &&
      holders[holder].lastTransferCycleId > cycleId
    ) {
      uint256 multiplier = cycleId.sub(
        holders[holder].lastTransferCycleId
      );

      if (multiplier > 0) {
        result = holders[holder].balance.mul(
          multiplier
        );
      }
    }

    return result;
  }

  function _calcHoldersWeightAtCycle(
    uint256 cycleId
  )
    private
    view
    returns (uint256)
  {
    uint256 result;

    if (
      summary.totalHolders > 0 &&
      summary.totalHolding > 0 &&
      summary.cycleId > cycleId
    ) {
      result = summary.totalHolders.mul(
        summary.totalHolding
      );
    }

    return result;
  }

  function _calcCycleWeight(
    uint256 cycleIdFrom,
    uint256 cycleIdTo,
    uint256 balance
  )
    private
    view
    returns (uint256)
  {
    uint256 result;

    if (cycleIdTo > cycleIdFrom) {
      uint256 cyclesCount = cycleIdTo.sub(cycleIdFrom);

      if (
        cyclesCount != 0 &&
        settings.cycleWeightGain != 0
      ) {
        result = balance.percent(
          cyclesCount.mul(settings.cycleWeightGain)
        );
      }
    }

    return result;
  }

  function _calcCurrentCycleId()
    private
    view
    returns (uint256)
  {
    uint256 result;

    if (settings.cycleLength > 0) {
      result = block
      .timestamp
      .sub(firstCycleTimestamp)
      .div(settings.cycleLength);
    }

    return result;

  }
}
