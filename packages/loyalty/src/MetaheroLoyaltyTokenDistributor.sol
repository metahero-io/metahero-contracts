// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "@metahero/common-contracts/src/access/Ownable.sol";
import "@metahero/common-contracts/src/utils/Initializable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";
import "@openzeppelin/contracts/utils/Context.sol";
import "./MetaheroLoyaltyToken.sol";
import "./constants.sol";

/**
 * @title Metahero Loyalty Token (distributor)
 *
 * @author Stanisław Głogowski <stan@metahero.io>
 */
contract MetaheroLoyaltyTokenDistributor is Ownable, Initializable, Context {
  using MerkleProof for bytes32[];

  enum DistributionStates {
    Ready,
    Paused,
    Finished
  }

  enum InvitationStates {
    Unknown,
    Added,
    Removed
  }

  struct Invitation {
    InvitationStates state;
    bytes32 treeRoot;
    uint256 depositPower;
    uint256 minDeposit;
    uint256 maxDeposit;
    uint256 minRewardsAPY;
    uint256 maxRewardsAPY;
    uint256 minWithdrawalLockTime;
    uint256 maxWithdrawalLockTime;
  }

  // constants

  uint256 private constant DEPOSIT_MAX_POWER = 100;

  // state variables

  DistributionStates private _distributionState;

  MetaheroLoyaltyToken private _loyaltyToken;

  IERC20 private _paymentToken;

  mapping(uint256 => Invitation) private _invitations;

  mapping(uint256 => mapping(address => bool)) private _usedInvitation;

  // errors

  error DistributionIsFinished();
  error DistributionIsNotReady();
  error InvalidDeposit();
  error InvalidDepositPower();
  error InvalidInvitationId();
  error InvalidInvitationProof();
  error InvalidMaxDeposit();
  error InvalidMaxRewardsAPY();
  error InvalidMaxWithdrawalLockTime();
  error InvalidMinDeposit();
  error InvalidMinWithdrawalLockTime();
  error InvalidWithdrawalLockTime();
  error InvitationAlreadyExists();
  error InvitationAlreadyUsed();
  error InvitationDoesntExist();
  error LoyaltyTokenIsTheZeroAddress();
  error NoRewardsToRelease();
  error PaymentTokenIsTheZeroAddress();

  // events

  event Initialized(address loyaltyToken, address paymentToken);

  event DistributionStateUpdated(DistributionStates distributionState);

  event RewardsReleased(uint256 rewards);

  event InvitationAdded(
    uint256 invitationId,
    bytes32 treeRoot,
    uint256 depositPower,
    uint256 minDeposit,
    uint256 maxDeposit,
    uint256 minRewardsAPY,
    uint256 maxRewardsAPY,
    uint256 minWithdrawalLockTime,
    uint256 maxWithdrawalLockTime
  );

  event InvitationRemoved(uint256 invitationId);

  event InvitationUsed(uint256 invitationId, uint256 tokenId, address owner);

  // modifiers

  modifier onlyWhenReady() {
    if (_distributionState != DistributionStates.Ready) {
      revert DistributionIsNotReady();
    }

    _;
  }

  modifier onlyWhenNotFinished() {
    if (_distributionState == DistributionStates.Finished) {
      revert DistributionIsFinished();
    }

    _;
  }

  // constructor

  constructor() Ownable() Initializable() {
    //
  }

  // initialize

  function initialize(address loyaltyToken, address paymentToken)
    external
    initializer
  {
    if (loyaltyToken == address(0)) {
      revert LoyaltyTokenIsTheZeroAddress();
    }

    if (paymentToken == address(0)) {
      revert PaymentTokenIsTheZeroAddress();
    }

    _loyaltyToken = MetaheroLoyaltyToken(loyaltyToken);

    _paymentToken = IERC20(paymentToken);

    emit Initialized(loyaltyToken, paymentToken);
  }

  // external functions (views)

  function getDistributionState() external view returns (DistributionStates) {
    return _distributionState;
  }

  function getInvitation(uint256 invitationId)
    external
    view
    returns (Invitation memory)
  {
    return _invitations[invitationId];
  }

  function getInvitations(uint256[] calldata invitationIds)
    external
    view
    returns (Invitation[] memory result)
  {
    uint256 len = invitationIds.length;

    result = new Invitation[](len);

    for (uint256 index; index < len; ) {
      result[index] = _invitations[invitationIds[index]];

      unchecked {
        ++index;
      }
    }

    return result;
  }

  function isInvitationInUse(uint256 invitationId, address account)
    external
    view
    returns (bool)
  {
    return _usedInvitation[invitationId][account];
  }

  // external functions

  function setDistributionState(DistributionStates distributionState)
    external
    onlyOwner
    onlyWhenNotFinished
  {
    _distributionState = distributionState;

    emit DistributionStateUpdated(distributionState);
  }

  function releaseRewards() external onlyOwner {
    uint256 rewards = _paymentToken.balanceOf(address(this));

    if (rewards == 0) {
      revert NoRewardsToRelease();
    }

    _paymentToken.transfer(_owner, rewards);

    emit RewardsReleased(rewards);
  }

  function addInvitation(
    uint256 invitationId,
    bytes32 treeRoot,
    uint256 depositPower,
    uint256 minDeposit,
    uint256 maxDeposit,
    uint256 minRewardsAPY,
    uint256 maxRewardsAPY,
    uint256 minWithdrawalLockTime,
    uint256 maxWithdrawalLockTime
  ) external onlyOwner onlyWhenNotFinished {
    if (invitationId == 0) {
      revert InvalidInvitationId();
    }

    if (_invitations[invitationId].state != InvitationStates.Unknown) {
      revert InvitationAlreadyExists();
    }

    if (depositPower == 0 || depositPower > DEPOSIT_MAX_POWER) {
      revert InvalidDepositPower();
    }

    if (minDeposit == 0) {
      revert InvalidMinDeposit();
    }

    if (maxDeposit < minDeposit) {
      revert InvalidMaxDeposit();
    }

    if (minRewardsAPY == 0) {
      if (maxRewardsAPY != 0) {
        revert InvalidMaxRewardsAPY();
      }

      if (maxWithdrawalLockTime != minWithdrawalLockTime) {
        revert InvalidMaxWithdrawalLockTime();
      }
    } else {
      if (maxRewardsAPY < minRewardsAPY) {
        revert InvalidMaxRewardsAPY();
      }

      if (minWithdrawalLockTime == 0) {
        revert InvalidMinWithdrawalLockTime();
      }

      if (maxWithdrawalLockTime < minWithdrawalLockTime) {
        revert InvalidMaxWithdrawalLockTime();
      }
    }

    _invitations[invitationId].state = InvitationStates.Added;
    _invitations[invitationId].treeRoot = treeRoot;
    _invitations[invitationId].depositPower = depositPower;
    _invitations[invitationId].minDeposit = minDeposit;
    _invitations[invitationId].maxDeposit = maxDeposit;
    _invitations[invitationId].minRewardsAPY = minRewardsAPY;
    _invitations[invitationId].maxRewardsAPY = maxRewardsAPY;
    _invitations[invitationId].minWithdrawalLockTime = minWithdrawalLockTime;
    _invitations[invitationId].maxWithdrawalLockTime = maxWithdrawalLockTime;

    emit InvitationAdded(
      invitationId,
      treeRoot,
      depositPower,
      minDeposit,
      maxDeposit,
      minRewardsAPY,
      maxRewardsAPY,
      minWithdrawalLockTime,
      maxWithdrawalLockTime
    );
  }

  function removeInvitation(uint256 invitationId) external onlyOwner {
    if (invitationId == 0) {
      revert InvalidInvitationId();
    }

    Invitation storage invitation = _invitations[invitationId];

    if (invitation.state != InvitationStates.Added) {
      revert InvitationDoesntExist();
    }

    invitation.state = InvitationStates.Removed;

    emit InvitationRemoved(invitationId);
  }

  function useInvitation(
    uint256 invitationId,
    uint256 deposit,
    uint256 withdrawalLockTime,
    bytes32[] memory proof
  ) external onlyWhenReady {
    if (invitationId == 0) {
      revert InvalidInvitationId();
    }

    Invitation memory invitation = _invitations[invitationId];

    if (invitation.state != InvitationStates.Added) {
      revert InvitationDoesntExist();
    }

    if (deposit < invitation.minDeposit || deposit > invitation.maxDeposit) {
      revert InvalidDeposit();
    }

    if (
      withdrawalLockTime < invitation.minWithdrawalLockTime ||
      withdrawalLockTime > invitation.maxWithdrawalLockTime
    ) {
      revert InvalidWithdrawalLockTime();
    }

    address sender = _msgSender();

    if (
      !proof.verify(invitation.treeRoot, keccak256(abi.encodePacked(sender)))
    ) {
      revert InvalidInvitationProof();
    }

    if (_usedInvitation[invitationId][sender]) {
      revert InvitationAlreadyUsed();
    }

    uint256 rewards;
    uint256 weight;
    uint256 unlockWithdrawalAt;

    {
      uint256 rewardsAPY;

      if (
        withdrawalLockTime == invitation.minWithdrawalLockTime //
      ) {
        rewardsAPY = invitation.minRewardsAPY;
      } else if (
        withdrawalLockTime == invitation.maxWithdrawalLockTime //
      ) {
        rewardsAPY = invitation.maxRewardsAPY;
      } else {
        unchecked {
          rewardsAPY =
            invitation.minRewardsAPY +
            ((invitation.maxRewardsAPY - invitation.minRewardsAPY) *
              (withdrawalLockTime - invitation.minWithdrawalLockTime)) /
            (invitation.maxWithdrawalLockTime -
              invitation.minWithdrawalLockTime);
        }
      }

      unchecked {
        rewards =
          (deposit * rewardsAPY * withdrawalLockTime) /
          (MAX_PERCENTAGE * YEAR_TIME);
      }

      uint256 availableRewards = _paymentToken.balanceOf(address(this));

      if (rewards > availableRewards) {
        rewards = 0;
        withdrawalLockTime = invitation.minWithdrawalLockTime;
      }
    }

    unchecked {
      weight = invitation.depositPower * deposit;
      unlockWithdrawalAt = block.timestamp + withdrawalLockTime;
    }

    uint256 tokenId = _loyaltyToken.mintToken(
      sender,
      deposit,
      rewards,
      weight,
      unlockWithdrawalAt
    );

    _usedInvitation[invitationId][sender] = true;

    _paymentToken.transferFrom(sender, address(_loyaltyToken), deposit);

    if (rewards != 0) {
      _paymentToken.transfer(address(_loyaltyToken), rewards);
    }

    emit InvitationUsed(invitationId, tokenId, sender);
  }
}
