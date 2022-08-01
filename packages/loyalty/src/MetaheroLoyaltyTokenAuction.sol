// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "@metahero/common-contracts/src/access/Ownable.sol";
import "@metahero/common-contracts/src/utils/Initializable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/Context.sol";
import "./MetaheroLoyaltyToken.sol";

contract MetaheroLoyaltyTokenAuction is Ownable, Initializable, Context {
  struct Auction {
    address highestBidder;
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

  error LoyaltyTokenIsTheZeroAddress();
  error PaymentTokenIsTheZeroAddress();
  error InvalidAuctionTime();
  error AuctionNotFound();
  error AuctionEnds();
  error AuctionInProgress();
  error InvalidBid();

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

  constructor() Ownable() Initializable() {
    //
  }

  // initialize

  function initialize(
    address loyaltyToken,
    address paymentToken,
    uint256 auctionTime,
    uint256 unlockWithdrawalMaxTime
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
  }

  function placeBid(uint256 tokenId, uint256 bid) external {
    address bidder = _msgSender();

    Auction storage auction = _auctions[tokenId];

    if (auction.highestBid == 0) {
      uint256 requiredDeposit = _loyaltyToken
        .getRequiredTokenResurrectionDeposit(tokenId);

      if (requiredDeposit == 0) {
        revert AuctionNotFound();
      }

      if (bid < requiredDeposit) {
        revert InvalidBid();
      }

      auction.requiredDeposit = requiredDeposit;
      auction.highestBidder = bidder;

      unchecked {
        auction.endsAt = block.timestamp + _auctionTime;
      }
    } else if (auction.endsAt >= block.timestamp) {
      revert AuctionEnds();
    } else if (auction.highestBid >= bid) {
      revert InvalidBid();
    } else if (bidder == auction.highestBidder) {
      _paymentToken.transferFrom(
        bidder,
        address(this),
        bid - auction.highestBid
      );
    } else {
      _paymentToken.transferFrom(bidder, address(this), bid);
      auction.highestBidder = bidder;
    }

    auction.highestBid = bid;

    emit BidPlaced(tokenId, bidder, bid);
  }

  function claimToken(uint256 tokenId) external {
    Auction memory auction = _auctions[tokenId];

    if (auction.requiredDeposit == 0) {
      revert AuctionNotFound();
    }

    if (auction.endsAt < block.timestamp) {
      revert AuctionInProgress();
    }

    address highestBidder = auction.highestBidder;
    uint256 highestBid = auction.highestBid;
    uint256 requiredDeposit = auction.requiredDeposit;
    uint256 unlockWithdrawalAt = block.timestamp;

    unchecked {
      uint256 bidDiff = highestBid - requiredDeposit;

      if (bidDiff == 0) {
        unlockWithdrawalAt += _unlockWithdrawalMaxTime;
      } else if (bidDiff < requiredDeposit) {
        unlockWithdrawalAt += (_unlockWithdrawalMaxTime -
          (bidDiff * _unlockWithdrawalMaxTime) /
          requiredDeposit);
      }
    }

    _loyaltyToken.resurrectToken(highestBidder, tokenId, unlockWithdrawalAt);

    delete _auctions[tokenId];

    emit TokenClaimed(
      tokenId,
      highestBidder,
      highestBid,
      requiredDeposit,
      unlockWithdrawalAt
    );
  }
}
