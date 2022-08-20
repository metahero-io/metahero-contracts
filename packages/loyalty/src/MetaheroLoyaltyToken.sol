// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "@metahero/common-contracts/src/access/Ownable.sol";
import "@metahero/common-contracts/src/utils/Initializable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "./constants.sol";

/**
 * @title Metahero Loyalty Token
 *
 * @author Stanisław Głogowski <stan@metahero.io>
 */
contract MetaheroLoyaltyToken is Ownable, Initializable, ERC721Enumerable {
  using Strings for uint256;

  enum TokenStates {
    Unknown,
    Minted,
    Burned
  }

  struct TokenDetails {
    TokenStates state;
    uint256 snapshotId;
    uint256 deposit;
    uint256 rewards;
    uint256 weight;
    uint256 unlockWithdrawalAt;
  }

  struct Snapshot {
    uint256 index;
    uint256 weights;
    uint256 rewards;
  }

  // constants

  uint256 private constant EARLY_WITHDRAWAL_MAX_TAX = 25_000; // 25%

  // state variables

  IERC20 private _paymentToken;

  address private _tokenAuction;

  address private _tokenDistributor;

  uint256 private _snapshotBaseTimestamp;

  uint256 private _snapshotWindowMinLength;

  uint256 private _earlyWithdrawalTax;

  uint256 private _totalTokensDeposits;

  uint256 private _totalTokensWeights;

  uint256 private _totalTokensRewards;

  uint256 private _totalSnapshotsRewards;

  uint256 private _tokenIdCounter;

  string private _tokenBaseURI;

  uint256[] private _snapshotIds;

  mapping(uint256 => Snapshot) private _snapshots;

  mapping(uint256 => TokenDetails) private _tokenDetails;

  // errors

  error InvalidEarlyWithdrawalTax();
  error InvalidSnapshotWindowMinLength();
  error InvalidTokenState();
  error MsgSenderIsNotTheTokenAuction();
  error MsgSenderIsNotTheTokenDistributor();
  error MsgSenderIsNotTheTokenOwner();
  error PaymentTokenIsTheZeroAddress();
  error TokenAuctionIsTheZeroAddress();
  error TokenDistributorIsTheZeroAddress();
  error TokenRewardsWithdrawalIsLocked();
  error NoTokenRewardsForWithdrawn();

  // events

  event Initialized(
    address paymentToken,
    address tokenAuction,
    address tokenDistributor,
    uint256 snapshotBaseTimestamp,
    uint256 snapshotWindowMinLength,
    uint256 earlyWithdrawalTax,
    string tokenBaseURI
  );

  event TokenBaseURIUpdated(string tokenBaseURI);

  event TokenMinted(
    uint256 tokenId,
    uint256 snapshotId,
    uint256 deposit,
    uint256 rewards,
    uint256 weight,
    uint256 unlockWithdrawalAt
  );

  event TokenBurned(uint256 tokenId, uint256 withdrawal);

  event TokenMarkedAsBurned(uint256 tokenId, uint256 deposit, uint256 weight);

  event TokenResurrected(
    uint256 tokenId,
    uint256 snapshotId,
    uint256 deposit,
    uint256 weight,
    uint256 unlockWithdrawalAt
  );

  event TokenRewardsWithdrawn(uint256 tokenId, uint256 rewards);

  // modifiers

  modifier onlyTokenAuction() {
    if (msg.sender != _tokenAuction) {
      revert MsgSenderIsNotTheTokenAuction();
    }

    _;
  }

  modifier onlyTokenDistributor() {
    if (msg.sender != _tokenDistributor) {
      revert MsgSenderIsNotTheTokenDistributor();
    }

    _;
  }

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
    address tokenAuction,
    address tokenDistributor,
    uint256 snapshotWindowMinLength,
    uint256 earlyWithdrawalTax,
    string calldata tokenBaseURI
  ) external initializer {
    if (paymentToken == address(0)) {
      revert PaymentTokenIsTheZeroAddress();
    }

    if (tokenAuction == address(0)) {
      revert TokenAuctionIsTheZeroAddress();
    }

    if (tokenDistributor == address(0)) {
      revert TokenDistributorIsTheZeroAddress();
    }

    if (snapshotWindowMinLength == 0) {
      revert InvalidSnapshotWindowMinLength();
    }

    if (earlyWithdrawalTax > EARLY_WITHDRAWAL_MAX_TAX) {
      revert InvalidEarlyWithdrawalTax();
    }

    uint256 snapshotBaseTimestamp = block.timestamp;

    _paymentToken = IERC20(paymentToken);

    _tokenAuction = tokenAuction;

    _tokenDistributor = tokenDistributor;

    _snapshotBaseTimestamp = snapshotBaseTimestamp;

    _snapshotWindowMinLength = snapshotWindowMinLength;

    _earlyWithdrawalTax = earlyWithdrawalTax;

    _tokenBaseURI = tokenBaseURI;

    emit Initialized(
      paymentToken,
      tokenAuction,
      tokenDistributor,
      snapshotBaseTimestamp,
      snapshotWindowMinLength,
      earlyWithdrawalTax,
      tokenBaseURI
    );
  }

  // public functions (views)

  function tokenURI(uint256 tokenId)
    public
    view
    override
    returns (string memory result)
  {
    if (_exists(tokenId) && bytes(_tokenBaseURI).length > 0) {
      result = string(
        abi.encodePacked(_tokenBaseURI, tokenId.toString(), ".json")
      );
    }

    return result;
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

  function getSummary()
    external
    view
    returns (
      uint256 totalDeposits,
      uint256 totalRewards,
      uint256 earlyWithdrawalTax
    )
  {
    uint256 totalSnapshotsRewards = _calcTotalSnapshotsRewards();

    unchecked {
      totalRewards = _totalTokensRewards + totalSnapshotsRewards;
    }

    return (_totalTokensDeposits, totalRewards, _earlyWithdrawalTax);
  }

  function getTokenSummary(uint256 tokenId)
    external
    view
    returns (
      address owner,
      uint256 deposit,
      uint256 rewards,
      uint256 unlockWithdrawalAt
    )
  {
    TokenDetails memory tokenDetails = _tokenDetails[tokenId];

    if (tokenDetails.state == TokenStates.Minted) {
      uint256 currentSnapshotId = _computeSnapshotId(block.timestamp);

      owner = ownerOf(tokenId);

      deposit = tokenDetails.deposit;

      uint256 snapshotRewards = _calcTokenSnapshotRewards(
        currentSnapshotId,
        tokenDetails.snapshotId,
        tokenDetails.weight
      );

      unchecked {
        rewards = tokenDetails.rewards + snapshotRewards;
      }

      unlockWithdrawalAt = tokenDetails.unlockWithdrawalAt;
    }

    return (owner, deposit, rewards, unlockWithdrawalAt);
  }

  function getRequiredTokenResurrectionDeposit(uint256 tokenId)
    external
    view
    returns (uint256 result)
  {
    TokenDetails memory tokenDetails = _tokenDetails[tokenId];

    if (tokenDetails.state == TokenStates.Burned) {
      result = tokenDetails.deposit;
    }

    return result;
  }

  // external functions

  function setTokenBaseURI(string calldata tokenBaseURI) external onlyOwner {
    _tokenBaseURI = tokenBaseURI;

    emit TokenBaseURIUpdated(tokenBaseURI);
  }

  function depositRewards(uint256 amount) external {
    address sender = _msgSender();
    uint256 currentSnapshotId = _computeSnapshotId(block.timestamp);

    _paymentToken.transferFrom(sender, address(this), amount);

    _syncSnapshot(currentSnapshotId);
  }

  function mintToken(
    address owner,
    uint256 deposit,
    uint256 rewards,
    uint256 weight,
    uint256 unlockWithdrawalAt
  ) external onlyTokenDistributor returns (uint256 tokenId) {
    uint256 currentSnapshotId = _computeSnapshotId(block.timestamp);

    unchecked {
      tokenId = ++_tokenIdCounter;
    }

    TokenDetails storage tokenDetails = _tokenDetails[tokenId];

    tokenDetails.state = TokenStates.Minted;
    tokenDetails.snapshotId = currentSnapshotId;
    tokenDetails.deposit = deposit;
    tokenDetails.rewards = rewards;
    tokenDetails.weight = weight;
    tokenDetails.unlockWithdrawalAt = unlockWithdrawalAt;

    unchecked {
      _totalTokensDeposits += deposit;
      _totalTokensRewards += rewards;
      _totalTokensWeights += weight;
    }

    _mint(owner, tokenId);

    _syncSnapshot(currentSnapshotId);

    emit TokenMinted(
      tokenId,
      currentSnapshotId,
      deposit,
      rewards,
      weight,
      unlockWithdrawalAt
    );

    return tokenId;
  }

  function withdrawTokenRewards(uint256 tokenId) external {
    address sender = _msgSender();

    TokenDetails storage tokenDetails = _tokenDetails[tokenId];

    if (tokenDetails.state != TokenStates.Minted) {
      revert InvalidTokenState();
    }

    if (sender != ownerOf(tokenId)) {
      revert MsgSenderIsNotTheTokenOwner();
    }

    if (tokenDetails.unlockWithdrawalAt > block.timestamp) {
      revert TokenRewardsWithdrawalIsLocked();
    }

    uint256 currentSnapshotId = _computeSnapshotId(block.timestamp);

    uint256 snapshotRewards = _calcTokenSnapshotRewards(
      currentSnapshotId,
      tokenDetails.snapshotId,
      tokenDetails.weight
    );

    uint256 rewards;

    unchecked {
      rewards = tokenDetails.rewards + snapshotRewards;
    }

    if (rewards == 0) {
      revert NoTokenRewardsForWithdrawn();
    }

    unchecked {
      _totalSnapshotsRewards -= snapshotRewards;
      _totalTokensRewards -= tokenDetails.rewards;
    }

    tokenDetails.snapshotId = currentSnapshotId;
    tokenDetails.rewards = 0;

    _paymentToken.transfer(sender, rewards);

    emit TokenRewardsWithdrawn(tokenId, rewards);
  }

  function burnToken(uint256 tokenId) external {
    address sender = _msgSender();

    TokenDetails storage tokenDetails = _tokenDetails[tokenId];

    if (tokenDetails.state != TokenStates.Minted) {
      revert InvalidTokenState();
    }

    if (sender != ownerOf(tokenId)) {
      revert MsgSenderIsNotTheTokenOwner();
    }

    uint256 withdrawal;

    if (tokenDetails.unlockWithdrawalAt > block.timestamp) {
      unchecked {
        withdrawal =
          ((MAX_PERCENTAGE - _earlyWithdrawalTax) * tokenDetails.deposit) /
          MAX_PERCENTAGE;
      }
    } else {
      uint256 currentSnapshotId = _computeSnapshotId(block.timestamp);

      uint256 snapshotRewards = _calcTokenSnapshotRewards(
        currentSnapshotId,
        tokenDetails.snapshotId,
        tokenDetails.weight
      );

      unchecked {
        withdrawal =
          tokenDetails.deposit +
          tokenDetails.rewards +
          snapshotRewards;

        _totalSnapshotsRewards -= snapshotRewards;
      }
    }

    unchecked {
      _totalTokensDeposits -= tokenDetails.deposit;
      _totalTokensRewards -= tokenDetails.rewards;
    }

    if (withdrawal != 0) {
      _paymentToken.transfer(sender, withdrawal);
    }

    tokenDetails.state = TokenStates.Burned;
    tokenDetails.snapshotId = 0;
    tokenDetails.rewards = 0;
    tokenDetails.unlockWithdrawalAt = 0;

    _burn(tokenId);

    emit TokenBurned(tokenId, withdrawal);
  }

  function markTokenAsBurned(
    uint256 tokenId,
    uint256 deposit,
    uint256 weight
  ) external onlyTokenAuction {
    TokenDetails storage tokenDetails = _tokenDetails[tokenId];

    if (tokenDetails.state != TokenStates.Unknown) {
      revert InvalidTokenState();
    }

    tokenDetails.state = TokenStates.Burned;
    tokenDetails.deposit = deposit;
    tokenDetails.weight = weight;

    emit TokenMarkedAsBurned(tokenId, deposit, weight);
  }

  function resurrectToken(
    address owner,
    uint256 tokenId,
    uint256 unlockWithdrawalAt
  ) external onlyTokenAuction {
    uint256 currentSnapshotId = _computeSnapshotId(block.timestamp);

    TokenDetails storage tokenDetails = _tokenDetails[tokenId];

    if (tokenDetails.state != TokenStates.Burned) {
      revert InvalidTokenState();
    }

    tokenDetails.state = TokenStates.Minted;
    tokenDetails.snapshotId = currentSnapshotId;
    tokenDetails.unlockWithdrawalAt = unlockWithdrawalAt;

    unchecked {
      _totalTokensDeposits += tokenDetails.deposit;
      _totalTokensWeights += tokenDetails.weight;
    }

    _mint(owner, tokenId);

    _syncSnapshot(currentSnapshotId);

    emit TokenResurrected(
      tokenId,
      currentSnapshotId,
      tokenDetails.deposit,
      tokenDetails.weight,
      unlockWithdrawalAt
    );
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

  function _calcTokenSnapshotRewards(
    uint256 currentSnapshotId,
    uint256 tokenSnapshotId,
    uint256 tokenWeight
  ) private view returns (uint256 result) {
    uint256 len = _snapshotIds.length;

    if (len != 0) {
      uint256 index;

      unchecked {
        index = len - 1;
      }

      for (;;) {
        uint256 snapshotId = _snapshotIds[index];

        if (snapshotId < currentSnapshotId) {
          if (snapshotId < tokenSnapshotId) {
            break;
          }

          Snapshot memory snapshot = _snapshots[snapshotId];

          unchecked {
            result += (tokenWeight * snapshot.rewards) / snapshot.weights;
          }
        }

        if (index == 0) {
          break;
        } else {
          unchecked {
            --index;
          }
        }
      }
    }

    return result;
  }

  function _calcTotalSnapshotsRewards() private view returns (uint256 result) {
    result = _paymentToken.balanceOf(address(this));

    unchecked {
      result -= _totalTokensDeposits;
      result -= _totalTokensRewards;
    }

    return result;
  }

  // private functions

  function _syncSnapshot(uint256 currentSnapshotId) private {
    if (_totalTokensWeights == 0) {
      return;
    }

    uint256 rewards;

    {
      uint256 totalSnapshotsRewards = _calcTotalSnapshotsRewards();

      if (totalSnapshotsRewards != _totalSnapshotsRewards) {
        unchecked {
          rewards = totalSnapshotsRewards - _totalSnapshotsRewards;
        }

        _totalSnapshotsRewards = totalSnapshotsRewards;
      }
    }

    if (rewards == 0) {
      return;
    }

    uint256 len = _snapshotIds.length;

    if (len == 0) {
      Snapshot storage snapshot = _snapshots[currentSnapshotId];

      snapshot.weights = _totalTokensWeights;
      snapshot.rewards = rewards;

      _snapshotIds.push(currentSnapshotId);

      return;
    }

    uint256 latestIndex;

    unchecked {
      latestIndex = len - 1;
    }

    uint256 latestSnapshotId = _snapshotIds[latestIndex];

    if (latestSnapshotId == currentSnapshotId) {
      Snapshot storage snapshot = _snapshots[latestSnapshotId];

      snapshot.weights = _totalTokensWeights;

      unchecked {
        snapshot.rewards += rewards;
      }
    } else {
      Snapshot storage snapshot = _snapshots[currentSnapshotId];

      snapshot.weights = _totalTokensWeights;
      snapshot.rewards = rewards;

      unchecked {
        snapshot.index = latestIndex + 1;
      }

      _snapshotIds.push(currentSnapshotId);
    }
  }
}
