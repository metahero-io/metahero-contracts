// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "@metahero/common-contracts/src/access/Ownable.sol";
import "@metahero/common-contracts/src/utils/Initializable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";

contract MetaheroLoyaltyToken is Ownable, Initializable, ERC721Enumerable {
  using MerkleProof for bytes32[];

  enum InvitationStates {
    Unknown,
    Opened,
    Closed
  }

  struct Invitation {
    InvitationStates state;
    bytes32 accountsTreeRoot;
    uint256 accountsLimit;
    uint256 availableRewards;
    uint256 depositPower;
    uint256 minDeposit;
    uint256 maxDeposit;
    uint256 minRewardsAPY;
    uint256 maxRewardsAPY;
    uint256 minLockTime;
    uint256 maxLockTime;
    uint256 autoCloseAt;
    uint256 totalAccount;
  }

  struct TokenDetails {
    uint256 invitationId;
    uint256 snapshotId;
    uint256 deposit;
    uint256 invitationRewards;
    uint256 weight;
    uint256 unlockAt;
  }

  struct Snapshot {
    uint256 index;
    uint256 weights;
    uint256 rewards;
  }

  IERC20 private _paymentToken;

  uint256 private _snapshotBaseTimestamp;

  uint256 private _snapshotWindowMinLength;

  uint256 private _maxTotalSupply;

  uint256 private _earlyWithdrawalTax;

  uint256 private _tokenIdCounter;

  uint256 private _totalDeposits;

  uint256 private _totalWeights;

  uint256 private _totalSnapshotsRewards;

  uint256 private _totalInvitationRewards;

  uint256[] private _snapshotIds;

  mapping(uint256 => Snapshot) private _snapshots;

  mapping(uint256 => Invitation) private _invitations;

  mapping(uint256 => mapping(address => bool)) private _invitationAccounts;

  mapping(uint256 => TokenDetails) private _tokenDetails;

  // globals

  uint256 private constant YEAR_TIME = 365 days;

  uint256 private constant MAX_POWER = 100;

  uint256 private constant MAX_PERCENTAGE = 100_000;

  uint256 private constant MAX_EARLY_WITHDRAWAL_TAX = 25_000; // 25%

  // errors

  error PaymentTokenIsTheZeroAddress();
  error InvalidSnapshotWindowMinLength();
  error InvalidMaxTotalSupply();
  error InvalidEarlyWithdrawalTax();
  error InvalidInvitationId();
  error InvitationAlreadyExists();
  error InvalidDepositPower();
  error InvalidMinDeposit();
  error InvalidMaxDeposit();
  error InvalidMaxRewardsAPY();
  error InvalidMinLockTime();
  error InvalidMaxLockTime();
  error AlreadyMinted();
  error InvalidProof();
  error InvalidDeposit();
  error InvalidLockTime();
  error NotEnoughRewards();

  error SenderIsNotTheTokenOwner();
  error LockedToken();

  error MaxTotalSupplyAchieved();

  // events

  event Initialized(
    address paymentToken,
    uint256 snapshotBaseTimestamp,
    uint256 snapshotWindowMinLength,
    uint256 maxTotalSupply,
    uint256 earlyWithdrawalTax
  );

  event InvitationAdded(
    uint256 invitationId,
    bytes32 accountsTreeRoot,
    uint256 accountsLimit,
    uint256 rewards,
    uint256 depositPower,
    uint256 minDeposit,
    uint256 maxDeposit,
    uint256 minRewardsAPY,
    uint256 maxRewardsAPY,
    uint256 minLockSnapshots,
    uint256 maxLockSnapshots,
    uint256 autoCloseAt
  );

  event InvitationRewardsUpdated(uint256 invitationId, uint256 rewards);

  event InvitationRewardsReleased(uint256 invitationId, uint256 rewards);

  event TokenMinted(
    uint256 tokenId,
    uint256 invitationId,
    address sender,
    address recipient,
    uint256 deposit,
    uint256 invitationRewards,
    uint256 weight,
    uint256 unlockAt
  );

  event TokenBurnt(
    uint256 tokenId,
    address sender,
    address recipient,
    uint256 withdrawal
  );

  // constructor

  constructor()
    Ownable()
    Initializable()
    ERC721("Metahero Loyalty", "LOYAL-HERO")
  {
    //
  }

  // initialize

  function initialize(
    address paymentToken,
    uint256 snapshotWindowMinLength,
    uint256 maxTotalSupply,
    uint256 earlyWithdrawalTax
  ) external initializer {
    if (paymentToken == address(0)) {
      revert PaymentTokenIsTheZeroAddress();
    }

    if (snapshotWindowMinLength == 0) {
      revert InvalidSnapshotWindowMinLength();
    }

    if (maxTotalSupply == 0) {
      revert InvalidMaxTotalSupply();
    }

    if (earlyWithdrawalTax > MAX_EARLY_WITHDRAWAL_TAX) {
      revert InvalidEarlyWithdrawalTax();
    }

    uint256 snapshotBaseTimestamp = block.timestamp; // solhint-disable-line not-rely-on-time;

    _paymentToken = IERC20(paymentToken);

    _snapshotBaseTimestamp = snapshotBaseTimestamp;

    _snapshotWindowMinLength = snapshotWindowMinLength;

    _maxTotalSupply = maxTotalSupply;

    _earlyWithdrawalTax = earlyWithdrawalTax;

    emit Initialized(
      paymentToken,
      snapshotBaseTimestamp,
      snapshotWindowMinLength,
      maxTotalSupply,
      earlyWithdrawalTax
    );
  }

  // external functions (views)

  function computeSnapshotId(uint256 timestamp)
    external
    view
    returns (uint256)
  {
    return _computeSnapshotId(timestamp);
  }

  function getSnapshot(uint256 snapshotId)
    external
    view
    returns (Snapshot memory)
  {
    return _snapshots[snapshotId];
  }

  function getInvitation(uint256 invitationId)
    external
    view
    returns (Invitation memory)
  {
    return _invitations[invitationId];
  }

  function getTokenDetails(uint256 tokenId)
    external
    view
    returns (TokenDetails memory)
  {
    return _tokenDetails[tokenId];
  }

  function getTokenValue(uint256 tokenId)
    external
    view
    returns (uint256 result)
  {
    TokenDetails memory tokenDetails = _tokenDetails[tokenId];

    if (tokenDetails.deposit != 0) {
      result = tokenDetails.deposit + tokenDetails.invitationRewards;
    }

    return result;
  }

  // external functions

  function addInvitation(
    uint256 invitationId,
    bytes32 accountsTreeRoot,
    uint256 accountsLimit,
    uint256 rewards,
    uint256 depositPower,
    uint256 minDeposit,
    uint256 maxDeposit,
    uint256 minRewardsAPY,
    uint256 maxRewardsAPY,
    uint256 minLockTime,
    uint256 maxLockTime,
    uint256 autoCloseIn
  ) external onlyOwner {
    if (invitationId == 0) {
      revert InvalidInvitationId();
    }

    if (_invitations[invitationId].state != InvitationStates.Unknown) {
      revert InvitationAlreadyExists();
    }

    if (depositPower > MAX_POWER) {
      revert InvalidDepositPower();
    }

    if (minDeposit == 0) {
      revert InvalidMinDeposit();
    }

    if (maxDeposit < minDeposit) {
      revert InvalidMaxDeposit();
    }

    if (maxRewardsAPY < minRewardsAPY) {
      revert InvalidMaxRewardsAPY();
    }

    if (minLockTime == 0) {
      revert InvalidMinLockTime();
    }

    if (maxLockTime < minLockTime) {
      revert InvalidMaxLockTime();
    }

    Invitation storage invitation = _invitations[invitationId];

    if (rewards != 0) {
      _paymentToken.transferFrom(_owner, address(this), rewards);

      invitation.availableRewards = rewards;

      _totalInvitationRewards += rewards;
    }

    invitation.state = InvitationStates.Opened;
    invitation.accountsTreeRoot = accountsTreeRoot;
    invitation.accountsLimit = accountsLimit;
    invitation.depositPower = depositPower;
    invitation.minDeposit = minDeposit;
    invitation.maxDeposit = maxDeposit;
    invitation.minRewardsAPY = minRewardsAPY;
    invitation.maxRewardsAPY = maxRewardsAPY;
    invitation.minLockTime = minLockTime;
    invitation.maxLockTime = maxLockTime;
    invitation.autoCloseAt = autoCloseIn != 0
      ? block.timestamp + autoCloseIn // solhint-disable-line not-rely-on-time
      : 0;

    emit InvitationAdded(
      invitationId,
      accountsTreeRoot,
      accountsLimit,
      rewards,
      depositPower,
      minDeposit,
      maxDeposit,
      minRewardsAPY,
      maxRewardsAPY,
      minLockTime,
      maxLockTime,
      invitation.autoCloseAt
    );
  }

  function mintToken(
    uint256 invitationId,
    uint256 deposit,
    uint256 lockTime,
    bytes32[] calldata proof,
    bool acceptLowerRewards
  ) external {
    address sender = _msgSender();

    _mintToken(
      sender,
      sender,
      invitationId,
      deposit,
      lockTime,
      proof,
      acceptLowerRewards
    );
  }

  function mintTokenTo(
    address recipient,
    uint256 invitationId,
    uint256 deposit,
    uint256 lockTime,
    bytes32[] calldata proof,
    bool acceptLowerRewards
  ) external {
    address sender = _msgSender();

    _mintToken(
      sender,
      recipient,
      invitationId,
      deposit,
      lockTime,
      proof,
      acceptLowerRewards
    );
  }

  function burnToken(uint256 tokenId, bool acceptEarlyWithdrawal) external {
    address sender = _msgSender();

    _burnToken(sender, sender, tokenId, acceptEarlyWithdrawal);
  }

  function burnTokenTo(
    address recipient,
    uint256 tokenId,
    bool acceptEarlyWithdrawal
  ) external {
    address sender = _msgSender();

    _burnToken(sender, recipient, tokenId, acceptEarlyWithdrawal);
  }

  // private functions (views)

  function _computeSnapshotId(uint256 timestamp)
    private
    view
    returns (uint256 result)
  {
    if (timestamp >= _snapshotBaseTimestamp) {
      unchecked {
        result =
          1 +
          (timestamp - _snapshotBaseTimestamp) /
          _snapshotWindowMinLength;
      }
    }

    return result;
  }

  function _calcTokenSnapshotRewards(TokenDetails memory tokenDetails)
    private
    view
    returns (uint256 result)
  {
    uint256 len = _snapshotIds.length;

    if (len != 0) {
      uint256 index = _snapshots[tokenDetails.snapshotId].index;
      uint256 lastIndex = len - 1;

      for (; index < lastIndex; ) {
        Snapshot memory snapshot = _snapshots[index];

        result += (tokenDetails.weight * snapshot.rewards) / snapshot.weights;

        unchecked {
          ++index;
        }
      }
    }

    return result;
  }

  // private functions

  function _getNextTokenId() private returns (uint256) {
    if (totalSupply() >= _maxTotalSupply) {
      revert MaxTotalSupplyAchieved();
    }

    unchecked {
      _tokenIdCounter += 1;
    }

    return _tokenIdCounter;
  }

  function _mintToken(
    address sender,
    address recipient,
    uint256 invitationId,
    uint256 deposit,
    uint256 lockTime,
    bytes32[] memory proof,
    bool acceptLowerRewards
  ) private {
    Invitation storage invitation = _invitations[invitationId];

    if (
      invitation.state != InvitationStates.Opened ||
      invitation.autoCloseAt >= block.timestamp // solhint-disable-line not-rely-on-time
    ) {
      revert InvalidInvitationId();
    }

    if (_invitationAccounts[invitationId][sender]) {
      revert AlreadyMinted();
    }

    if (invitation.accountsTreeRoot != bytes32(0)) {
      if (
        !proof.verify(
          invitation.accountsTreeRoot,
          keccak256(abi.encodePacked(sender))
        )
      ) {
        revert InvalidProof();
      }
    } else if (invitation.accountsLimit != 0) {
      if (invitation.accountsLimit == 1) {
        invitation.state = InvitationStates.Closed;
      }

      invitation.accountsLimit -= 1;
    }

    if (deposit < invitation.minDeposit || deposit > invitation.maxDeposit) {
      revert InvalidDeposit();
    }

    if (
      lockTime < invitation.minLockTime || lockTime > invitation.maxLockTime
    ) {
      revert InvalidLockTime();
    }

    _paymentToken.transferFrom(sender, address(this), deposit);

    uint256 invitationRewards;

    if (invitation.minRewardsAPY != 0) {
      uint256 rewardsAPY;

      if (lockTime == invitation.minLockTime) {
        rewardsAPY = invitation.minRewardsAPY;
      } else if (lockTime == invitation.maxLockTime) {
        rewardsAPY = invitation.maxRewardsAPY;
      } else {
        unchecked {
          rewardsAPY =
            invitation.minRewardsAPY +
            ((invitation.maxRewardsAPY - invitation.minRewardsAPY) *
              (lockTime - invitation.minLockTime)) /
            (invitation.maxLockTime - invitation.minLockTime);
        }
      }

      invitationRewards =
        (deposit * rewardsAPY * lockTime) /
        (MAX_PERCENTAGE * YEAR_TIME);

      if (invitationRewards > invitation.availableRewards) {
        if (acceptLowerRewards) {
          invitationRewards = invitation.availableRewards;
        } else {
          revert NotEnoughRewards();
        }
      }
    }

    uint256 tokenId = _getNextTokenId();

    TokenDetails storage tokenDetails = _tokenDetails[tokenId];

    {
      uint256 weight;
      uint256 unlockAt;

      unchecked {
        weight = deposit * invitation.depositPower;

        unlockAt = block.timestamp * lockTime; // solhint-disable-line not-rely-on-time

        invitation.availableRewards -= invitationRewards;
        invitation.totalAccount += 1;

        _totalDeposits += deposit;
        _totalWeights += weight;
      }

      tokenDetails.invitationId = invitationId;
      tokenDetails.snapshotId = _computeSnapshotId(block.timestamp); // solhint-disable-line not-rely-on-time
      tokenDetails.deposit = deposit;
      tokenDetails.invitationRewards = invitationRewards;
      tokenDetails.weight = weight;
      tokenDetails.unlockAt = unlockAt;

      _invitationAccounts[invitationId][sender] = true;
    }

    _mint(recipient, tokenId);

    _syncSnapshot(tokenDetails.snapshotId);

    emit TokenMinted(
      tokenId,
      invitationId,
      sender,
      recipient,
      deposit,
      invitationRewards,
      tokenDetails.weight,
      tokenDetails.unlockAt
    );
  }

  function _burnToken(
    address sender,
    address recipient,
    uint256 tokenId,
    bool acceptEarlyWithdrawal
  ) private {
    address owner = ownerOf(tokenId);

    if (sender != owner) {
      revert SenderIsNotTheTokenOwner();
    }

    TokenDetails memory tokenDetails = _tokenDetails[tokenId];

    _syncSnapshot(tokenDetails.snapshotId);

    uint256 withdrawal;

    if (
      tokenDetails.unlockAt >= block.timestamp // solhint-disable-line not-rely-on-time
    ) {
      if (_earlyWithdrawalTax == 0) {
        withdrawal = tokenDetails.deposit;
      } else if (acceptEarlyWithdrawal) {
        unchecked {
          withdrawal =
            ((MAX_PERCENTAGE - _earlyWithdrawalTax) * tokenDetails.deposit) /
            MAX_PERCENTAGE;
        }
      } else {
        revert LockedToken();
      }
    } else {
      uint256 snapshotRewards = _calcTokenSnapshotRewards(tokenDetails);

      unchecked {
        withdrawal =
          tokenDetails.deposit +
          tokenDetails.invitationRewards +
          snapshotRewards;

        _totalSnapshotsRewards -= snapshotRewards;
      }
    }

    unchecked {
      _totalDeposits -= tokenDetails.deposit;
      _totalInvitationRewards -= tokenDetails.invitationRewards;
    }

    if (recipient != address(0) && withdrawal != 0) {
      _paymentToken.transfer(recipient, withdrawal);
    }

    _burn(tokenId);

    delete _tokenDetails[tokenId];

    emit TokenBurnt(tokenId, sender, recipient, withdrawal);
  }

  function _syncSnapshot(uint256 snapshotId) private {
    if (_totalWeights == 0) {
      return;
    }

    uint256 rewards;

    {
      uint256 totalRewards = _paymentToken.balanceOf(address(this));

      unchecked {
        totalRewards -= _totalDeposits;
        totalRewards -= _totalInvitationRewards;
      }

      if (_totalSnapshotsRewards != totalRewards) {
        unchecked {
          rewards = totalRewards - _totalSnapshotsRewards;
        }

        _totalSnapshotsRewards = totalRewards;
      }
    }

    uint256 len = _snapshotIds.length;

    if (len == 0) {
      if (rewards != 0) {
        Snapshot storage snapshot = _snapshots[snapshotId];

        snapshot.weights = _totalWeights;
        snapshot.rewards = rewards;

        _snapshotIds.push(snapshotId);
      }

      return;
    }

    uint256 latestIndex;

    unchecked {
      latestIndex = len - 1;
    }

    uint256 latestSnapshotId = _snapshotIds[latestIndex];
    Snapshot storage latestSnapshot = _snapshots[latestSnapshotId];

    latestSnapshot.weights = _totalWeights;
    latestSnapshot.rewards += rewards;

    if (
      latestSnapshot.rewards != 0 && //
      latestSnapshotId != snapshotId
    ) {
      Snapshot storage snapshot = _snapshots[snapshotId];

      unchecked {
        snapshot.index = latestIndex + 1;
      }

      _snapshotIds.push(snapshotId);
    }
  }
}
