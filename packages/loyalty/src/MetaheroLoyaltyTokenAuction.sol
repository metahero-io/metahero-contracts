// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "@metahero/common-contracts/src/access/Ownable.sol";
import "@metahero/common-contracts/src/utils/Initializable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./MetaheroLoyaltyToken.sol";

/**
 * @title Metahero Loyalty Token (auction manager)
 *
 * @author Stanisław Głogowski <stan@metahero.io>
 */
contract MetaheroLoyaltyTokenAuction is Ownable, Initializable, Pausable {
  struct Auction {
    address topBidder;
    uint256 highestBid;
    uint256 requiredDeposit;
    uint256 endsAt;
  }

  // state variables

  MetaheroLoyaltyToken private _loyaltyToken;

  IERC20 private _paymentToken;

  uint256 private _auctionTime;

  uint256 private _unlockWithdrawalMaxTime;

  // errors

  error AuctionEnds();
  error AuctionInProgress();
  error AuctionNotFound();
  error InvalidAuctionTime();
  error InvalidBid();
  error InvalidInitialAuctionDeposit();
  error InvalidInitialAuctionsWeightsLength();
  error LoyaltyTokenIsTheZeroAddress();
  error PaymentTokenIsTheZeroAddress();
  error PlaceBidPaused();

  // events

  event Initialized(
    address loyaltyToken,
    address paymentToken,
    uint256 auctionTime,
    uint256 unlockWithdrawalMaxTime
  );

  event BidPlaced(uint256 tokenId, address bidder, uint256 bid);

  event TokenClaimed(
    uint256 tokenId,
    address bidder,
    uint256 bid,
    uint256 deposit,
    uint256 unlockWithdrawalAt
  );

  // state variables

  mapping(uint256 => Auction) private _auctions;

  // constructor

  constructor() Ownable() Initializable() Pausable() {
    //
  }

  // initialize

  function initialize(
    address loyaltyToken,
    address paymentToken,
    uint256 auctionTime,
    uint256 unlockWithdrawalMaxTime,
    uint256[] calldata initialAuctionsDeposits,
    uint256[] calldata initialAuctionsWeights
  ) external initializer {
    if (loyaltyToken == address(0)) {
      revert LoyaltyTokenIsTheZeroAddress();
    }

    if (paymentToken == address(0)) {
      revert PaymentTokenIsTheZeroAddress();
    }

    if (auctionTime == 0) {
      revert InvalidAuctionTime();
    }

    _loyaltyToken = MetaheroLoyaltyToken(loyaltyToken);

    _paymentToken = IERC20(paymentToken);

    _auctionTime = auctionTime;

    _unlockWithdrawalMaxTime = unlockWithdrawalMaxTime;

    emit Initialized(
      loyaltyToken,
      paymentToken,
      auctionTime,
      unlockWithdrawalMaxTime
    );

    // import initial auctions
    {
      uint256 depositsLen = initialAuctionsDeposits.length;
      uint256 weightsLen = initialAuctionsWeights.length;

      for (uint256 index; index < depositsLen; ) {
        uint256 tokenId;

        unchecked {
          tokenId = index + 1;
        }

        uint256 deposit = initialAuctionsDeposits[index];
        uint256 weight;

        if (deposit == 0) {
          revert InvalidInitialAuctionDeposit();
        }

        if (weightsLen > index) {
          weight = initialAuctionsWeights[index];
        }

        if (weight == 0) {
          weight = deposit;
        }

        _loyaltyToken.markTokenAsBurned(tokenId, deposit, weight);

        unchecked {
          ++index;
        }
      }
    }
  }

  // external functions (views)

  function getAuction(uint256 tokenId) external view returns (Auction memory) {
    return _auctions[tokenId];
  }

  // external functions

  function togglePaused() external onlyOwner {
    if (paused()) {
      _unpause();
    } else {
      _pause();
    }
  }

  function placeBid(uint256 tokenId, uint256 bid) external {
    address bidder = _msgSender();

    Auction storage auction = _auctions[tokenId];

    if (auction.highestBid == 0) {
      if (paused()) {
        revert PlaceBidPaused();
      }

      uint256 requiredDeposit = _loyaltyToken
        .getRequiredTokenResurrectionDeposit(tokenId);

      if (requiredDeposit == 0) {
        revert AuctionNotFound();
      }

      if (bid < requiredDeposit) {
        revert InvalidBid();
      }

      _paymentToken.transferFrom(bidder, address(this), bid);

      auction.requiredDeposit = requiredDeposit;
      auction.topBidder = bidder;

      unchecked {
        auction.endsAt = block.timestamp + _auctionTime;
      }
    } else if (auction.endsAt <= block.timestamp) {
      revert AuctionEnds();
    } else if (auction.highestBid >= bid) {
      revert InvalidBid();
    } else if (bidder == auction.topBidder) {
      uint256 value;

      unchecked {
        value = bid - auction.highestBid;
      }

      _paymentToken.transferFrom(bidder, address(this), value);
    } else {
      _paymentToken.transfer(auction.topBidder, auction.highestBid);

      _paymentToken.transferFrom(bidder, address(this), bid);

      auction.topBidder = bidder;
    }

    auction.highestBid = bid;

    emit BidPlaced(tokenId, bidder, bid);
  }

  function claimToken(uint256 tokenId) external {
    Auction memory auction = _auctions[tokenId];

    if (auction.requiredDeposit == 0) {
      revert AuctionNotFound();
    }

    if (auction.endsAt > block.timestamp) {
      revert AuctionInProgress();
    }

    address topBidder = auction.topBidder;
    uint256 highestBid = auction.highestBid;
    uint256 requiredDeposit = auction.requiredDeposit;
    uint256 unlockWithdrawalAt = block.timestamp;

    unchecked {
      uint256 bidDiff = highestBid - requiredDeposit;

      if (bidDiff < requiredDeposit) {
        unlockWithdrawalAt += (_unlockWithdrawalMaxTime -
          (bidDiff * _unlockWithdrawalMaxTime) /
          requiredDeposit);
      }
    }

    _paymentToken.transfer(address(_loyaltyToken), highestBid);

    _loyaltyToken.resurrectToken(topBidder, tokenId, unlockWithdrawalAt);

    delete _auctions[tokenId];

    emit TokenClaimed(
      tokenId,
      topBidder,
      highestBid,
      requiredDeposit,
      unlockWithdrawalAt
    );
  }
}
