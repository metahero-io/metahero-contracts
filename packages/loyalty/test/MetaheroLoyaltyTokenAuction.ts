import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { helpers, ethers } from 'hardhat';
import { expect } from 'chai';
import {
  MetaheroLoyaltyTokenAuction,
  MetaheroLoyaltyToken,
  ERC20PresetFixedSupply,
} from '../typechain';

const {
  constants: { AddressZero, MaxUint256 },
} = ethers;

const {
  deployContract,
  getSigners,
  increaseNextBlockTimestamp,
  processTransaction,
  randomAddress,
  resetSnapshots,
  revertSnapshot,
} = helpers;

describe('MetaheroLoyaltyTokenAuction', () => {
  const unlockWithdrawalMaxTime = 1000;
  const auctionTime = 10;
  const initialAuctionsDeposits = [
    100, 1_000, 10_000, 100, 1_000, 10_000, 100, 1_000, 10_000,
  ];
  const initialAuctionsWeights = [150, 1_500];
  const paymentTokenTotalSupply = 1_000_000;
  const snapshotWindowMinLength = 10;
  const earlyWithdrawalTax = 5_000;

  let paymentToken: ERC20PresetFixedSupply;
  let loyaltyTokenAuction: MetaheroLoyaltyTokenAuction;
  let loyaltyToken: MetaheroLoyaltyToken;
  let deployer: SignerWithAddress;
  let account: SignerWithAddress;

  before(async () => {
    [deployer, account] = await getSigners();

    paymentToken = await deployContract(
      'ERC20PresetFixedSupply',
      '',
      '',
      paymentTokenTotalSupply,
      deployer.address,
    );

    loyaltyToken = await deployContract('MetaheroLoyaltyToken');

    loyaltyTokenAuction = await deployContract('MetaheroLoyaltyTokenAuction');
  });

  const createBeforeHook = (
    options: {
      initialize?: boolean;
    } = {},
  ) => {
    options = {
      initialize: true,
      ...options,
    };

    before(async () => {
      await revertSnapshot();

      await processTransaction(
        loyaltyToken.initialize(
          paymentToken.address,
          loyaltyTokenAuction.address,
          randomAddress(),
          snapshotWindowMinLength,
          earlyWithdrawalTax,
          '',
        ),
      );

      if (options.initialize) {
        await processTransaction(
          loyaltyTokenAuction.initialize(
            loyaltyToken.address,
            paymentToken.address,
            auctionTime,
            unlockWithdrawalMaxTime,
            initialAuctionsDeposits,
            initialAuctionsWeights,
          ),
        );
      }
    });
  };

  after(() => {
    resetSnapshots();
  });

  describe('initialize()', () => {
    createBeforeHook({
      initialize: false,
    });

    it('expect to revert when msg.sender is not the deployer', async () => {
      await expect(
        loyaltyTokenAuction
          .connect(account)
          .initialize(randomAddress(), randomAddress(), 0, 0, [], []),
      ).revertedWith('MsgSenderIsNotTheDeployer()');
    });

    it('expect to revert when loyalty token is the zero address', async () => {
      await expect(
        loyaltyTokenAuction.initialize(
          AddressZero,
          randomAddress(),
          auctionTime,
          0,
          [],
          [],
        ),
      ).revertedWith('LoyaltyTokenIsTheZeroAddress()');
    });

    it('expect to revert when payment token is the zero address', async () => {
      await expect(
        loyaltyTokenAuction.initialize(
          randomAddress(),
          AddressZero,
          auctionTime,
          unlockWithdrawalMaxTime,
          [],
          [],
        ),
      ).revertedWith('PaymentTokenIsTheZeroAddress()');
    });

    it('expect to revert when auction time is zero', async () => {
      await expect(
        loyaltyTokenAuction.initialize(
          randomAddress(),
          randomAddress(),
          0,
          unlockWithdrawalMaxTime,
          [],
          [],
        ),
      ).revertedWith('InvalidAuctionTime()');
    });

    it('expect to revert when deposit eq 0', async () => {
      await expect(
        loyaltyTokenAuction.initialize(
          randomAddress(),
          randomAddress(),
          auctionTime,
          unlockWithdrawalMaxTime,
          [0],
          initialAuctionsWeights,
        ),
      ).revertedWith('InvalidInitialAuctionDeposit()');
    });

    it('expect to initialize the contract', async () => {
      expect(await loyaltyTokenAuction.initialized()).to.eq(false);

      const { tx } = await processTransaction(
        loyaltyTokenAuction.initialize(
          loyaltyToken.address,
          paymentToken.address,
          auctionTime,
          unlockWithdrawalMaxTime,
          initialAuctionsDeposits,
          initialAuctionsWeights,
        ),
      );

      await expect(tx)
        .to.emit(loyaltyTokenAuction, 'Initialized')
        .withArgs(
          loyaltyToken.address,
          paymentToken.address,
          auctionTime,
          unlockWithdrawalMaxTime,
        );

      expect(await loyaltyTokenAuction.initialized()).to.eq(true);
    });

    it('expect to revert when contract is initialized', async () => {
      await expect(
        loyaltyTokenAuction.initialize(
          loyaltyToken.address,
          paymentToken.address,
          auctionTime,
          unlockWithdrawalMaxTime,
          initialAuctionsDeposits,
          initialAuctionsWeights,
        ),
      ).revertedWith('AlreadyInitialized()');
    });
  });

  describe('# external functions (views)', () => {
    const bid = initialAuctionsDeposits[0] + 10;
    let endsAt = auctionTime;

    createBeforeHook();

    before(async () => {
      await processTransaction(
        paymentToken.approve(loyaltyTokenAuction.address, MaxUint256),
      );

      endsAt += await increaseNextBlockTimestamp();

      await processTransaction(loyaltyTokenAuction.placeBid(1, bid));
    });

    describe('getAuction()', () => {
      it('expect to return an auction', async () => {
        const output = await loyaltyTokenAuction.getAuction(1);

        expect(output.topBidder).to.eq(deployer.address);
        expect(output.highestBid).to.eq(bid);
        expect(output.requiredDeposit).to.eq(initialAuctionsDeposits[0]);
        expect(output.endsAt).to.eq(endsAt);
      });
    });
  });

  describe('# external functions', () => {
    describe('togglePaused()', () => {
      createBeforeHook();

      it('expect to revert when msg.sender is not the contract owner', async () => {
        await expect(
          loyaltyTokenAuction.connect(account).togglePaused(),
        ).revertedWith('MsgSenderIsNotTheOwner()');
      });

      it('expect to pause when is un-paused', async () => {
        const { tx } = await processTransaction(
          loyaltyTokenAuction.togglePaused(),
        );

        await expect(tx)
          .to.emit(loyaltyTokenAuction, 'Paused')
          .withArgs(deployer.address);

        expect(await loyaltyTokenAuction.paused()).to.eq(true);
      });

      it('expect to un-pause when is paused', async () => {
        const { tx } = await processTransaction(
          loyaltyTokenAuction.togglePaused(),
        );

        await expect(tx)
          .to.emit(loyaltyTokenAuction, 'Unpaused')
          .withArgs(deployer.address);

        expect(await loyaltyTokenAuction.paused()).to.eq(false);
      });
    });

    describe('placeBid()', () => {
      createBeforeHook();

      before(async () => {
        await processTransaction(
          paymentToken.approve(loyaltyTokenAuction.address, MaxUint256),
        );

        await processTransaction(
          paymentToken.approve(loyaltyTokenAuction.address, MaxUint256),
        );

        await processTransaction(
          paymentToken
            .connect(account)
            .approve(loyaltyTokenAuction.address, MaxUint256),
        );

        await processTransaction(
          paymentToken.transfer(account.address, initialAuctionsDeposits[3]),
        );

        // id: 1
        {
          const tokenId = 1;
          const bid = initialAuctionsDeposits[tokenId - 1];

          await processTransaction(loyaltyTokenAuction.placeBid(tokenId, bid));
        }

        await increaseNextBlockTimestamp(auctionTime + 1);

        // id: 2
        {
          const tokenId = 2;
          const bid = initialAuctionsDeposits[tokenId - 1];

          await processTransaction(loyaltyTokenAuction.placeBid(tokenId, bid));
        }

        // id: 4
        {
          const tokenId = 4;
          const bid = initialAuctionsDeposits[tokenId - 1];

          await processTransaction(
            loyaltyTokenAuction.connect(account).placeBid(tokenId, bid),
          );
        }
      });

      it('expect to revert on auction not found', async () => {
        await expect(loyaltyTokenAuction.placeBid(100, 100)).revertedWith(
          'AuctionNotFound()',
        );
      });

      it('expect to revert when action ends', async () => {
        const tokenId = 1;
        const bid = initialAuctionsDeposits[tokenId - 1] + 10;

        await expect(loyaltyTokenAuction.placeBid(tokenId, bid)).revertedWith(
          'AuctionEnds()',
        );
      });

      it('expect to revert on first invalid bid', async () => {
        const tokenId = 3;
        const bid = initialAuctionsDeposits[tokenId - 1] - 10;

        await expect(loyaltyTokenAuction.placeBid(tokenId, bid)).revertedWith(
          'InvalidBid()',
        );
      });

      it('expect to revert on next invalid bid', async () => {
        const tokenId = 2;
        const bid = initialAuctionsDeposits[tokenId - 1];

        await expect(loyaltyTokenAuction.placeBid(tokenId, bid)).revertedWith(
          'InvalidBid()',
        );
      });

      it('expect to place first bid', async () => {
        const tokenId = 5;
        const bid = initialAuctionsDeposits[tokenId - 1];

        const { tx } = await processTransaction(
          loyaltyTokenAuction.placeBid(tokenId, bid),
        );

        await expect(tx)
          .to.emit(loyaltyTokenAuction, 'BidPlaced')
          .withArgs(tokenId, deployer.address, bid);
      });

      it('expect to beat own bid', async () => {
        const tokenId = 2;
        const bid = initialAuctionsDeposits[tokenId - 1] + 10;

        const { tx } = await processTransaction(
          loyaltyTokenAuction.placeBid(tokenId, bid),
        );

        await expect(tx)
          .to.emit(loyaltyTokenAuction, 'BidPlaced')
          .withArgs(tokenId, deployer.address, bid);
      });

      it('expect to beat other bid', async () => {
        const tokenId = 4;
        const bid = initialAuctionsDeposits[tokenId - 1] + 10;

        const { tx } = await processTransaction(
          loyaltyTokenAuction.placeBid(tokenId, bid),
        );

        await expect(tx)
          .to.emit(loyaltyTokenAuction, 'BidPlaced')
          .withArgs(tokenId, deployer.address, bid);
      });

      describe('# when paused', () => {
        before(async () => {
          await processTransaction(loyaltyTokenAuction.togglePaused());
        });

        it('expect to revert on new auction', async () => {
          await expect(
            loyaltyTokenAuction.placeBid(100, initialAuctionsDeposits[0]),
          ).revertedWith('PlaceBidPaused()');
        });
      });
    });

    describe('claimToken()', () => {
      createBeforeHook();

      before(async () => {
        await processTransaction(
          paymentToken.approve(loyaltyTokenAuction.address, MaxUint256),
        );

        // id: 1
        {
          const tokenId = 1;
          const bid = initialAuctionsDeposits[tokenId - 1] * 1.5;

          await processTransaction(loyaltyTokenAuction.placeBid(tokenId, bid));
        }

        // id: 2
        {
          const tokenId = 2;
          const bid = initialAuctionsDeposits[tokenId - 1] * 2;

          await processTransaction(loyaltyTokenAuction.placeBid(tokenId, bid));
        }

        await increaseNextBlockTimestamp(auctionTime + 1);

        // id: 3
        {
          const tokenId = 3;
          const bid = initialAuctionsDeposits[tokenId - 1];

          await processTransaction(loyaltyTokenAuction.placeBid(tokenId, bid));
        }
      });

      it('expect to revert on auction not found', async () => {
        await expect(loyaltyTokenAuction.claimToken(100)).revertedWith(
          'AuctionNotFound()',
        );
      });

      it("expect to revert when action doesn't end", async () => {
        await expect(loyaltyTokenAuction.claimToken(3)).revertedWith(
          'AuctionInProgress()',
        );
      });

      it('expect to claim token #1 ', async () => {
        const tokenId = 1;

        const { tx } = await processTransaction(
          loyaltyTokenAuction.claimToken(tokenId),
        );

        await expect(tx).to.emit(loyaltyTokenAuction, 'TokenClaimed');
      });

      it('expect to claim token #2 ', async () => {
        const tokenId = 2;

        const { tx } = await processTransaction(
          loyaltyTokenAuction.claimToken(tokenId),
        );

        await expect(tx).to.emit(loyaltyTokenAuction, 'TokenClaimed');
      });
    });
  });
});
