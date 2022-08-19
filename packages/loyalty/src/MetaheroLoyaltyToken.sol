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
    unchecked {
      totalRewards = _totalTokensRewards + _totalSnapshotsRewards;
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
      owner = ownerOf(tokenId);

      deposit = tokenDetails.deposit;

      unchecked {
        rewards =
          tokenDetails.rewards +
          _calcTokenSnapshotRewards(tokenDetails);
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

  function mintToken(
    address owner,
    uint256 deposit,
    uint256 rewards,
    uint256 weight,
    uint256 unlockWithdrawalAt
  ) external onlyTokenDistributor returns (uint256 tokenId) {
    uint256 snapshotId = _computeSnapshotId(block.timestamp);

    unchecked {
      tokenId = ++_tokenIdCounter;
    }

    TokenDetails storage tokenDetails = _tokenDetails[tokenId];

    tokenDetails.state = TokenStates.Minted;
    tokenDetails.snapshotId = snapshotId;
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

    _syncSnapshot(snapshotId);

    emit TokenMinted(
      tokenId,
      snapshotId,
      deposit,
      rewards,
      weight,
      unlockWithdrawalAt
    );

    return tokenId;
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
      uint256 snapshotRewards = _calcTokenSnapshotRewards(tokenDetails);

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
    uint256 snapshotId = _computeSnapshotId(block.timestamp);

    TokenDetails storage tokenDetails = _tokenDetails[tokenId];

    if (tokenDetails.state != TokenStates.Burned) {
      revert InvalidTokenState();
    }

    tokenDetails.state = TokenStates.Minted;
    tokenDetails.snapshotId = snapshotId;
    tokenDetails.unlockWithdrawalAt = unlockWithdrawalAt;

    unchecked {
      _totalTokensDeposits += tokenDetails.deposit;
      _totalTokensWeights += tokenDetails.weight;
    }

    _mint(owner, tokenId);

    _syncSnapshot(snapshotId);

    emit TokenResurrected(
      tokenId,
      snapshotId,
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

  function _calcTokenSnapshotRewards(TokenDetails memory tokenDetails)
    private
    view
    returns (uint256 result)
  {
    uint256 len = _snapshotIds.length;

    if (len != 0) {
      uint256 index = _snapshots[tokenDetails.snapshotId].index;
      uint256 lastIndex = len - 1;

      for (; index <= lastIndex; ) {
        Snapshot memory snapshot = _snapshots[_snapshotIds[index]];

        unchecked {
          result += (tokenDetails.weight * snapshot.rewards) / snapshot.weights;

          ++index;
        }
      }
    }

    return result;
  }

  // private functions

  function _syncSnapshot(uint256 snapshotId) private {
    if (_totalTokensWeights == 0) {
      return;
    }

    uint256 rewards;

    {
      uint256 temp = _paymentToken.balanceOf(address(this));

      unchecked {
        temp -= _totalTokensDeposits;
        temp -= _totalTokensRewards;
      }

      if (temp != _totalSnapshotsRewards) {
        unchecked {
          rewards = temp - _totalSnapshotsRewards;
        }

        _totalSnapshotsRewards = temp;
      }
    }

    uint256 len = _snapshotIds.length;

    if (len == 0) {
      if (rewards != 0) {
        Snapshot storage snapshot = _snapshots[snapshotId];

        snapshot.weights = _totalTokensWeights;
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

    latestSnapshot.weights = _totalTokensWeights;

    unchecked {
      latestSnapshot.rewards += rewards;
    }

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
