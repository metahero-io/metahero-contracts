import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { helpers, ethers } from 'hardhat';
import { expect } from 'chai';
import { MetaheroLoyaltyToken, ERC20PresetFixedSupply } from '../typechain';
import { MAX_PERCENTAGE } from './constants';
import { constants } from 'ethers';

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
  const tokenBaseURI = 'http://test';

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

    await processTransaction(
      paymentToken.approve(loyaltyToken.address, constants.MaxUint256),
    );
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
            tokenBaseURI,
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
            tokenBaseURI,
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
          tokenBaseURI,
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
          tokenBaseURI,
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
          tokenBaseURI,
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
          tokenBaseURI,
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
          tokenBaseURI,
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
          tokenBaseURI,
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
          tokenBaseURI,
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
          tokenBaseURI,
        ),
      ).revertedWith('AlreadyInitialized()');
    });
  });

  describe('# public / external functions (views)', () => {
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

    describe('tokenURI()', () => {
      it('expect to correct token URI', async () => {
        expect(await loyaltyToken.tokenURI(1)).eq(`${tokenBaseURI}${1}.json`);
      });

      it('expect to empty URI for non-existing token', async () => {
        expect(await loyaltyToken.tokenURI(100)).eq('');
      });
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

    describe('getSummary()', () => {
      it('expect to return the summary', async () => {
        const output = await loyaltyToken.getSummary();

        expect(output.earlyWithdrawalTax).to.eq(earlyWithdrawalTax);
        expect(output.totalDeposits).to.eq(accountDeposit);
        expect(output.totalRewards).to.eq(accountRewards + snapshotsRewards);
      });
    });

    describe('getTokenSummary()', () => {
      it('expect to return the token summary', async () => {
        const output = await loyaltyToken.getTokenSummary(1);

        expect(output.owner).to.eq(account.address);
        expect(output.deposit).to.eq(accountDeposit);
        expect(output.rewards).to.eq(accountRewards);
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

  describe('# external functions', () => {
    describe('setTokenBaseURI()', () => {
      const tokenBaseURI = 'test';

      createBeforeHook();

      it('expect to revert when msg.sender is not the token owner', async () => {
        await expect(
          loyaltyToken.connect(account).setTokenBaseURI(tokenBaseURI),
        ).revertedWith('MsgSenderIsNotTheOwner()');
      });

      it('expect to set token base URI', async () => {
        const { tx } = await processTransaction(
          loyaltyToken.setTokenBaseURI(tokenBaseURI),
        );

        await expect(tx)
          .to.emit(loyaltyToken, 'TokenBaseURIUpdated')
          .withArgs(tokenBaseURI);
      });
    });

    describe('depositRewards()', () => {
      const rewards = 1000;

      createBeforeHook();

      it('expect to deposit rewards', async () => {
        const { tx } = await processTransaction(
          loyaltyToken.depositRewards(rewards),
        );

        await expect(tx)
          .to.emit(paymentToken, 'Transfer')
          .withArgs(deployer.address, loyaltyToken.address, rewards);
      });
    });

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

    describe('withdrawTokenRewards()', () => {
      const tokenId = 1;
      const deposit = 1000;
      const rewards = 100;
      const weight = 1;
      const unlockTime = 1000;

      createBeforeHook();

      before(async () => {
        const timestamp = await increaseNextBlockTimestamp();

        // id: 1

        await processTransaction(
          paymentToken.transfer(loyaltyToken.address, deposit),
        );

        await processTransaction(
          loyaltyToken
            .connect(tokenDistributor)
            .mintToken(
              account.address,
              deposit,
              0,
              weight,
              timestamp + unlockTime,
            ),
        );
      });

      it("expect to revert when token doesn't exist", async () => {
        await expect(loyaltyToken.withdrawTokenRewards(100)).revertedWith(
          'InvalidTokenState()',
        );
      });

      it('expect to revert when msg.sender is not the token owner', async () => {
        await expect(loyaltyToken.withdrawTokenRewards(1)).revertedWith(
          'MsgSenderIsNotTheTokenOwner()',
        );
      });

      it('expect to revert when withdrawal is locked', async () => {
        await expect(
          loyaltyToken.connect(account).withdrawTokenRewards(1),
        ).revertedWith('TokenRewardsWithdrawalIsLocked()');
      });

      describe('# when withdrawal is unlocked', () => {
        before(async () => {
          await increaseNextBlockTimestamp(unlockTime);
        });

        it('expect to revert when there is no rewards to withdraw', async () => {
          await expect(
            loyaltyToken.connect(account).withdrawTokenRewards(1),
          ).revertedWith('NoTokenRewardsForWithdrawn()');
        });

        describe('# withdraw on #1 snapshot', () => {
          before(async () => {
            await processTransaction(loyaltyToken.depositRewards(rewards));

            await increaseNextBlockTimestamp(snapshotWindowMinLength);
          });

          it('expect to withdraw rewards', async () => {
            const { tx } = await processTransaction(
              loyaltyToken.connect(account).withdrawTokenRewards(1),
            );

            await expect(tx)
              .to.emit(loyaltyToken, 'TokenRewardsWithdrawn')
              .withArgs(tokenId, rewards);
          });
        });

        describe('# withdraw on #2 snapshot', () => {
          before(async () => {
            await processTransaction(loyaltyToken.depositRewards(rewards));

            await increaseNextBlockTimestamp(snapshotWindowMinLength);
          });

          it('expect to withdraw rewards', async () => {
            const { tx } = await processTransaction(
              loyaltyToken.connect(account).withdrawTokenRewards(1),
            );

            await expect(tx)
              .to.emit(loyaltyToken, 'TokenRewardsWithdrawn')
              .withArgs(tokenId, rewards);
          });
        });

        describe('# withdraw on #3 snapshot', () => {
          before(async () => {
            await processTransaction(
              paymentToken.transfer(loyaltyToken.address, deposit),
            );

            await processTransaction(
              loyaltyToken
                .connect(tokenDistributor)
                .mintToken(account.address, deposit, 0, weight, 1),
            );

            await processTransaction(loyaltyToken.depositRewards(rewards));

            await increaseNextBlockTimestamp(snapshotWindowMinLength);
          });

          it('expect to withdraw rewards', async () => {
            const { tx } = await processTransaction(
              loyaltyToken.connect(account).withdrawTokenRewards(1),
            );

            await expect(tx)
              .to.emit(loyaltyToken, 'TokenRewardsWithdrawn')
              .withArgs(tokenId, rewards / 2);
          });
        });
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
