import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { helpers, ethers } from 'hardhat';
import { expect } from 'chai';
import { MetaheroLoyaltyToken, ERC20PresetFixedSupply } from '../typechain';
import { MAX_PERCENTAGE } from './constants';

const {
  constants: { AddressZero },
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

describe('MetaheroLoyaltyToken', () => {
  const EARLY_WITHDRAWAL_MAX_TAX = 25_000;
  const paymentTokenTotalSupply = 1_000_000;
  const snapshotWindowMinLength = 10;
  const earlyWithdrawalTax = 5_000;

  let paymentToken: ERC20PresetFixedSupply;
  let loyaltyToken: MetaheroLoyaltyToken;
  let deployer: SignerWithAddress;
  let account: SignerWithAddress;
  let tokenAuction: SignerWithAddress;
  let tokenDistributor: SignerWithAddress;
  let snapshotBaseTimestamp: number;

  before(async () => {
    [deployer, account, tokenAuction, tokenDistributor] = await getSigners();

    paymentToken = await deployContract(
      'ERC20PresetFixedSupply',
      '',
      '',
      paymentTokenTotalSupply,
      deployer.address,
    );

    loyaltyToken = await deployContract('MetaheroLoyaltyToken');
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

      if (options.initialize) {
        snapshotBaseTimestamp = await increaseNextBlockTimestamp();

        await processTransaction(
          loyaltyToken.initialize(
            paymentToken.address,
            tokenAuction.address,
            tokenDistributor.address,
            snapshotWindowMinLength,
            earlyWithdrawalTax,
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
        loyaltyToken
          .connect(account)
          .initialize(
            paymentToken.address,
            randomAddress(),
            randomAddress(),
            snapshotWindowMinLength,
            earlyWithdrawalTax,
          ),
      ).revertedWith('MsgSenderIsNotTheDeployer()');
    });

    it('expect to revert when payment token is the zero address', async () => {
      await expect(
        loyaltyToken.initialize(
          AddressZero,
          randomAddress(),
          randomAddress(),
          snapshotWindowMinLength,
          earlyWithdrawalTax,
        ),
      ).revertedWith('PaymentTokenIsTheZeroAddress()');
    });

    it('expect to revert when token auction is the zero address', async () => {
      await expect(
        loyaltyToken.initialize(
          randomAddress(),
          AddressZero,
          randomAddress(),
          snapshotWindowMinLength,
          earlyWithdrawalTax,
        ),
      ).revertedWith('TokenAuctionIsTheZeroAddress()');
    });

    it('expect to revert when token distributor is the zero address', async () => {
      await expect(
        loyaltyToken.initialize(
          randomAddress(),
          randomAddress(),
          AddressZero,
          snapshotWindowMinLength,
          earlyWithdrawalTax,
        ),
      ).revertedWith('TokenDistributorIsTheZeroAddress()');
    });

    it('expect to revert on invalid snapshot window min length', async () => {
      await expect(
        loyaltyToken.initialize(
          randomAddress(),
          randomAddress(),
          randomAddress(),
          0,
          earlyWithdrawalTax,
        ),
      ).revertedWith('InvalidSnapshotWindowMinLength()');
    });

    it('expect to revert on invalid early withdrawal tax', async () => {
      await expect(
        loyaltyToken.initialize(
          randomAddress(),
          randomAddress(),
          randomAddress(),
          snapshotWindowMinLength,
          EARLY_WITHDRAWAL_MAX_TAX + 1,
        ),
      ).revertedWith('InvalidEarlyWithdrawalTax()');
    });

    it('expect to initialize the contract', async () => {
      expect(await loyaltyToken.initialized()).to.eq(false);

      const snapshotBaseTimestamp = await increaseNextBlockTimestamp();

      const { tx } = await processTransaction(
        loyaltyToken.initialize(
          paymentToken.address,
          tokenAuction.address,
          tokenDistributor.address,
          snapshotWindowMinLength,
          earlyWithdrawalTax,
        ),
      );

      await expect(tx)
        .to.emit(loyaltyToken, 'Initialized')
        .withArgs(
          paymentToken.address,
          tokenAuction.address,
          tokenDistributor.address,
          snapshotBaseTimestamp,
          snapshotWindowMinLength,
          earlyWithdrawalTax,
        );

      expect(await loyaltyToken.initialized()).to.eq(true);
    });

    it('expect to revert when contract is initialized', async () => {
      await expect(
        loyaltyToken.initialize(
          paymentToken.address,
          randomAddress(),
          randomAddress(),
          snapshotWindowMinLength,
          earlyWithdrawalTax,
        ),
      ).revertedWith('AlreadyInitialized()');
    });
  });

  describe('# external functions (views)', () => {
    const totalBalance = 1_000_000;
    const accountDeposit = 25_000;
    const accountWeight = 40_000;
    const accountRewards = 10_000;
    const snapshotsRewards = totalBalance - accountDeposit - accountRewards;
    const unlockWithdrawalIn = 10;
    let unlockWithdrawalAt: number;

    createBeforeHook();

    before(async () => {
      await processTransaction(
        paymentToken.transfer(loyaltyToken.address, totalBalance),
      );

      unlockWithdrawalAt =
        (await increaseNextBlockTimestamp()) + unlockWithdrawalIn;

      await processTransaction(
        loyaltyToken
          .connect(tokenDistributor)
          .mintToken(
            account.address,
            accountDeposit,
            accountRewards,
            accountWeight,
            unlockWithdrawalAt,
          ),
      );

      await processTransaction(
        loyaltyToken
          .connect(tokenAuction)
          .markTokenAsBurned(2, accountDeposit, accountWeight),
      );
    });

    describe('computeSnapshotId()', () => {
      it('expect to return 0 for invalid timestamp', async () => {
        expect(
          await loyaltyToken.computeSnapshotId(snapshotBaseTimestamp - 100),
        ).eq(0);
      });

      it('expect to return a snapshot id', async () => {
        const expected = 14;

        expect(
          await loyaltyToken.computeSnapshotId(
            snapshotBaseTimestamp +
              (expected - 1) * snapshotWindowMinLength +
              1,
          ),
        ).eq(expected);
      });
    });

    describe('getSnapshot()', () => {
      it('expect to return the snapshot', async () => {
        const output = await loyaltyToken.getSnapshot(1);

        expect(output.index).to.eq(0);
        expect(output.weights).to.eq(accountWeight);
        expect(output.rewards).to.eq(
          totalBalance - accountDeposit - accountRewards,
        );
      });
    });

    describe('getTokenSummary()', () => {
      it('expect to return the token summary', async () => {
        const output = await loyaltyToken.getTokenSummary(1);

        expect(output.owner).to.eq(account.address);
        expect(output.deposit).to.eq(accountDeposit);
        expect(output.rewards).to.eq(accountRewards + snapshotsRewards);
        expect(output.unlockWithdrawalAt).to.eq(unlockWithdrawalAt);
      });

      it('expect to return empty summary for non-existing token', async () => {
        const output = await loyaltyToken.getTokenSummary(10);

        expect(output.owner).to.eq(AddressZero);
        expect(output.deposit).to.eq(0);
        expect(output.rewards).to.eq(0);
        expect(output.unlockWithdrawalAt).to.eq(0);
      });
    });

    describe('getRequiredTokenResurrectionDeposit()', () => {
      it('expect to return deposit for burned token', async () => {
        expect(await loyaltyToken.getRequiredTokenResurrectionDeposit(2)).to.eq(
          accountDeposit,
        );
      });

      it('expect to return 0 for non-burned token', async () => {
        expect(await loyaltyToken.getRequiredTokenResurrectionDeposit(1)).to.eq(
          0,
        );
      });
    });
  });

  describe('# external functions (views)', () => {
    describe('mintToken()', () => {
      const snapshotId = 1;
      const owner = randomAddress();
      const deposit = 1000;
      const rewards = 100;
      const weight = 200;
      const unlockWithdrawalAt = 2000;

      createBeforeHook();

      it('expect to revert when msg.sender is not the token distributor', async () => {
        await expect(
          loyaltyToken.mintToken(randomAddress(), 1, 1, 0, earlyWithdrawalTax),
        ).revertedWith('MsgSenderIsNotTheTokenDistributor()');
      });

      it('expect to mint token #1', async () => {
        const tokenId = 1;

        const { tx } = await processTransaction(
          loyaltyToken
            .connect(tokenDistributor)
            .mintToken(owner, deposit, rewards, weight, unlockWithdrawalAt),
        );

        await expect(tx)
          .to.emit(loyaltyToken, 'TokenMinted')
          .withArgs(
            tokenId,
            snapshotId,
            deposit,
            rewards,
            weight,
            unlockWithdrawalAt,
          );
      });

      it('expect to mint token #2', async () => {
        const tokenId = 2;

        const { tx } = await processTransaction(
          loyaltyToken
            .connect(tokenDistributor)
            .mintToken(owner, deposit, rewards, weight, unlockWithdrawalAt),
        );

        await expect(tx)
          .to.emit(loyaltyToken, 'TokenMinted')
          .withArgs(
            tokenId,
            snapshotId,
            deposit,
            rewards,
            weight,
            unlockWithdrawalAt,
          );
      });

      it('expect to mint token #3', async () => {
        const tokenId = 3;
        const snapshotsCount = 4;
        await increaseNextBlockTimestamp(
          snapshotWindowMinLength * snapshotsCount,
        );

        const { tx } = await processTransaction(
          loyaltyToken
            .connect(tokenDistributor)
            .mintToken(owner, deposit, rewards, weight, unlockWithdrawalAt),
        );

        await expect(tx)
          .to.emit(loyaltyToken, 'TokenMinted')
          .withArgs(
            tokenId,
            snapshotsCount + 1,
            deposit,
            rewards,
            weight,
            unlockWithdrawalAt,
          );
      });
    });

    describe('burnToken()', () => {
      const deposit = 1000;
      const rewards = 100;

      createBeforeHook();

      before(async () => {
        const timestamp = await increaseNextBlockTimestamp();

        // id: 1

        await processTransaction(
          paymentToken.transfer(loyaltyToken.address, deposit + rewards),
        );

        await processTransaction(
          loyaltyToken
            .connect(tokenDistributor)
            .mintToken(account.address, deposit, rewards, 0, timestamp - 1000),
        );

        // id: 2

        await processTransaction(
          paymentToken.transfer(loyaltyToken.address, deposit + rewards),
        );

        await processTransaction(
          loyaltyToken
            .connect(tokenDistributor)
            .mintToken(account.address, deposit, rewards, 0, timestamp + 1000),
        );

        // id: 3

        await processTransaction(
          loyaltyToken
            .connect(tokenDistributor)
            .mintToken(account.address, 0, 0, 0, timestamp),
        );
      });

      it("expect to revert when token doesn't exist", async () => {
        await expect(loyaltyToken.burnToken(100)).revertedWith(
          'InvalidTokenState()',
        );
      });

      it('expect to revert when msg.sender is not the token owner', async () => {
        await expect(loyaltyToken.burnToken(1)).revertedWith(
          'MsgSenderIsNotTheTokenOwner()',
        );
      });

      it('expect to burn token #1', async () => {
        const tokenId = 1;
        const withdrawal = deposit + rewards;

        const { tx } = await processTransaction(
          loyaltyToken.connect(account).burnToken(tokenId),
        );

        await expect(tx)
          .to.emit(loyaltyToken, 'TokenBurned')
          .withArgs(tokenId, withdrawal);
      });

      it('expect to burn token #2', async () => {
        const tokenId = 2;
        const withdrawal =
          deposit - (deposit * earlyWithdrawalTax) / MAX_PERCENTAGE;

        const { tx } = await processTransaction(
          loyaltyToken.connect(account).burnToken(tokenId),
        );

        await expect(tx)
          .to.emit(loyaltyToken, 'TokenBurned')
          .withArgs(tokenId, withdrawal);
      });

      it('expect to burn token #3', async () => {
        const tokenId = 3;
        const withdrawal = 0;

        const { tx } = await processTransaction(
          loyaltyToken.connect(account).burnToken(tokenId),
        );

        await expect(tx)
          .to.emit(loyaltyToken, 'TokenBurned')
          .withArgs(tokenId, withdrawal);
      });
    });

    describe('markTokenAsBurned()', () => {
      const tokenId = 1;

      createBeforeHook();

      before(async () => {
        await processTransaction(
          loyaltyToken.connect(tokenAuction).markTokenAsBurned(tokenId, 0, 0),
        );
      });

      it('expect to revert when msg.sender is not the token auction', async () => {
        await expect(loyaltyToken.markTokenAsBurned(2, 0, 0)).revertedWith(
          'MsgSenderIsNotTheTokenAuction()',
        );
      });

      it('expect to revert when token exists', async () => {
        await expect(
          loyaltyToken.connect(tokenAuction).markTokenAsBurned(tokenId, 0, 0),
        ).revertedWith('InvalidTokenState()');
      });

      it('expect to mark token as burned', async () => {
        const tokenId = 2;
        const deposit = 300;
        const weight = 100;

        const { tx } = await processTransaction(
          loyaltyToken
            .connect(tokenAuction)
            .markTokenAsBurned(tokenId, deposit, weight),
        );

        await expect(tx)
          .to.emit(loyaltyToken, 'TokenMarkedAsBurned')
          .withArgs(tokenId, deposit, weight);
      });
    });

    describe('resurrectToken()', () => {
      const snapshotsCount = 4;
      const snapshotId = snapshotsCount + 1;
      const deposit = 100;
      const weight = 200;
      const unlockWithdrawalAt = 100;
      let tokenId = 1;

      createBeforeHook();

      before(async () => {
        await increaseNextBlockTimestamp(
          snapshotWindowMinLength * snapshotsCount,
        );

        await processTransaction(
          loyaltyToken
            .connect(tokenAuction)
            .markTokenAsBurned(tokenId, deposit, weight),
        );
      });

      it('expect to revert when msg.sender is not the token auction', async () => {
        await expect(
          loyaltyToken.resurrectToken(
            account.address,
            tokenId,
            unlockWithdrawalAt,
          ),
        ).revertedWith('MsgSenderIsNotTheTokenAuction()');
      });

      it('expect to revert when token exists', async () => {
        await expect(
          loyaltyToken
            .connect(tokenAuction)
            .resurrectToken(account.address, 2, unlockWithdrawalAt),
        ).revertedWith('InvalidTokenState()');
      });

      it('expect to resurrect token', async () => {
        const { tx } = await processTransaction(
          loyaltyToken
            .connect(tokenAuction)
            .resurrectToken(account.address, tokenId, unlockWithdrawalAt),
        );

        await expect(tx)
          .to.emit(loyaltyToken, 'TokenResurrected')
          .withArgs(tokenId, snapshotId, deposit, weight, unlockWithdrawalAt);

        ++tokenId;
      });

      describe('# transfer rewards before resurrection', () => {
        before(async () => {
          await processTransaction(
            paymentToken.transfer(loyaltyToken.address, deposit),
          );

          await processTransaction(
            loyaltyToken
              .connect(tokenAuction)
              .markTokenAsBurned(tokenId, deposit, weight),
          );
        });

        it('expect to revert when msg.sender is not the token auction', async () => {
          const { tx } = await processTransaction(
            loyaltyToken
              .connect(tokenAuction)
              .resurrectToken(account.address, tokenId, unlockWithdrawalAt),
          );

          await expect(tx)
            .to.emit(loyaltyToken, 'TokenResurrected')
            .withArgs(tokenId, snapshotId, deposit, weight, unlockWithdrawalAt);

          ++tokenId;
        });
      });

      describe('# transfer rewards before all', () => {
        const snapshotId = 1;

        createBeforeHook();

        before(async () => {
          await processTransaction(
            paymentToken.transfer(loyaltyToken.address, deposit),
          );

          await processTransaction(
            loyaltyToken
              .connect(tokenAuction)
              .markTokenAsBurned(tokenId, deposit, weight),
          );
        });

        it('expect to revert when msg.sender is not the token auction', async () => {
          const { tx } = await processTransaction(
            loyaltyToken
              .connect(tokenAuction)
              .resurrectToken(account.address, tokenId, unlockWithdrawalAt),
          );

          await expect(tx)
            .to.emit(loyaltyToken, 'TokenResurrected')
            .withArgs(tokenId, snapshotId, deposit, weight, unlockWithdrawalAt);

          ++tokenId;
        });
      });
    });
  });
});