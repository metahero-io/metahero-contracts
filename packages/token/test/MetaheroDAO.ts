import { ethers, helpers } from 'hardhat';
import { expect } from 'chai';
import { BigNumber, constants, utils } from 'ethers';
import { MetaheroLPMMock, MetaheroDAO, MetaheroToken } from '../typechain';
import { Signer, setNextBlockTimestamp, randomAddress } from './helpers';

const { getSigners } = ethers;

const { deployContract } = helpers;

describe('MetaheroDAO', () => {
  const BURN_FEE = {
    sender: 1,
    recipient: 1,
  };
  const LP_FEE = {
    sender: 3,
    recipient: 3,
  };
  const REWARDS_FEE = {
    sender: 1,
    recipient: 1,
  };
  const TOKEN_TOTAL_SUPPLY = utils.parseEther('10000000');
  const MIN_VOTING_PERIOD = 200;
  const SNAPSHOT_WINDOW = 100;
  const VOTES = {
    Y: 1,
    N: 2,
  };

  let operator: Signer;
  let fakeToken: Signer;
  let signers: Signer[];
  let token: MetaheroToken;
  let lpm: MetaheroLPMMock;
  let dao: MetaheroDAO;

  before(async () => {
    [operator, fakeToken, ...signers] = await getSigners();
  });

  const createBeforeHook = (
    options: {
      initialize?: boolean;
      useFakeToken?: boolean;
      setTokenDao?: boolean;
      postBefore?: () => Promise<void>;
    } = {},
  ) => {
    const { initialize, useFakeToken, setTokenDao, postBefore } = {
      initialize: true,
      setTokenDao: true,
      ...options,
    };

    before(async () => {
      dao = await deployContract('MetaheroDAO');

      if (!useFakeToken) {
        token = await deployContract('MetaheroToken');
        lpm = await deployContract('MetaheroLPMMock');
      }

      if (initialize) {
        if (!useFakeToken) {
          await token.initialize(
            BURN_FEE,
            LP_FEE,
            REWARDS_FEE,
            0,
            lpm.address,
            constants.AddressZero,
            TOKEN_TOTAL_SUPPLY,
            [],
          );

          await lpm.initialize(token.address);

          await token.setPresaleAsFinished();

          await dao.initialize(
            token.address,
            constants.AddressZero,
            MIN_VOTING_PERIOD,
            SNAPSHOT_WINDOW,
          );

          if (setTokenDao) {
            await token.setDAO(dao.address);
          }
        } else {
          await dao.initialize(
            fakeToken.address,
            operator.address,
            MIN_VOTING_PERIOD,
            SNAPSHOT_WINDOW,
          );
        }

        if (postBefore) {
          await postBefore();
        }
      }
    });
  };

  context('initialize()', () => {
    createBeforeHook({
      initialize: false,
    });

    it('expect to revert when token is the zero address', async () => {
      await expect(
        dao.initialize(constants.AddressZero, constants.AddressZero, 0, 0),
      ).to.be.revertedWith('MetaheroDAO#3');
    });

    it('expect to revert when  min voting period is zero', async () => {
      await expect(
        dao.initialize(token.address, constants.AddressZero, 0, 0),
      ).to.be.revertedWith('MetaheroDAO#4');
    });

    it('expect to revert when snapshot window is zero', async () => {
      await expect(
        dao.initialize(
          token.address,
          constants.AddressZero,
          MIN_VOTING_PERIOD,
          0,
        ),
      ).to.be.revertedWith('MetaheroDAO#5');
    });

    it('expect to initialize the contract', async () => {
      const timestamp = await setNextBlockTimestamp();

      const tx = await dao.initialize(
        token.address,
        constants.AddressZero,
        MIN_VOTING_PERIOD,
        SNAPSHOT_WINDOW,
      );

      expect(tx)
        .to.emit(dao, 'Initialized')
        .withArgs(
          token.address,
          operator.address,
          MIN_VOTING_PERIOD,
          SNAPSHOT_WINDOW,
          timestamp,
        );
    });
  });

  context('syncMember()', () => {
    const member = randomAddress();
    let timestamp: number;

    createBeforeHook({
      useFakeToken: true,
    });

    it('expect to revert when sender is not the token', async () => {
      await expect(dao.syncMember(member, 0, 0)).to.be.revertedWith(
        'MetaheroDAO#2',
      );
    });

    it('expect to sync member', async () => {
      timestamp = await setNextBlockTimestamp();

      const memberWeight = 1000;
      const totalWeight = 2000;

      await dao
        .connect(fakeToken)
        .syncMember(member, memberWeight, totalWeight);

      expect(await dao.getCurrentSnapshotId()).to.equal(1);
      expect(await dao.getCurrentMemberWeight(member)).to.equal(memberWeight);
      expect(await dao.getCurrentTotalWeight()).to.equal(totalWeight);
    });

    it('expect to sync member on the same snapshot', async () => {
      timestamp = await setNextBlockTimestamp();

      const memberWeight = 2000;
      const totalWeight = 3000;

      await dao
        .connect(fakeToken)
        .syncMember(member, memberWeight, totalWeight);

      expect(await dao.getCurrentSnapshotId()).to.equal(1);
      expect(await dao.getCurrentMemberWeight(member)).to.equal(memberWeight);
      expect(await dao.getCurrentTotalWeight()).to.equal(totalWeight);
    });

    it('expect to sync member on next snapshot', async () => {
      timestamp = await setNextBlockTimestamp(timestamp + SNAPSHOT_WINDOW);

      const memberWeight = 4000;
      const totalWeight = 5000;

      await dao
        .connect(fakeToken)
        .syncMember(member, memberWeight, totalWeight);

      expect(await dao.getCurrentSnapshotId()).to.equal(2);
      expect(await dao.getCurrentMemberWeight(member)).to.equal(memberWeight);
      expect(await dao.getCurrentTotalWeight()).to.equal(totalWeight);
    });
  });

  context('syncMembers()', () => {
    createBeforeHook({
      useFakeToken: true,
    });

    it('expect to revert when sender is not the token', async () => {
      await expect(
        dao.syncMembers(randomAddress(), 0, randomAddress(), 0, 0),
      ).to.be.revertedWith('MetaheroDAO#2');
    });

    it('expect to sync members', async () => {
      const memberA = randomAddress();
      const memberAWeight = 1000;
      const memberB = randomAddress();
      const memberBWeight = 3000;
      const totalWeight = 9000;

      await dao
        .connect(fakeToken)
        .syncMembers(
          memberA,
          memberAWeight,
          memberB,
          memberBWeight,
          totalWeight,
        );

      expect(await dao.getCurrentMemberWeight(memberA)).to.equal(memberAWeight);
      expect(await dao.getCurrentMemberWeight(memberB)).to.equal(memberBWeight);
      expect(await dao.getCurrentTotalWeight()).to.equal(totalWeight);
    });
  });

  context('removeAllTokenFees()', () => {
    createBeforeHook();

    it('expect to revert when sender is not the operator', async () => {
      await expect(
        dao.connect(signers[0]).removeAllTokenFees(),
      ).to.be.revertedWith('MetaheroDAO#1');
    });

    it('expect to remove all fees', async () => {
      await dao.connect(operator).removeAllTokenFees();

      const { burnFees, lpFees, rewardsFees } = await token.settings();

      expect(burnFees.sender).to.equal(0);
      expect(burnFees.recipient).to.equal(0);
      expect(lpFees.sender).to.equal(0);
      expect(lpFees.recipient).to.equal(0);
      expect(rewardsFees.sender).to.equal(0);
      expect(rewardsFees.recipient).to.equal(0);
    });
  });

  context('removeTokenLPFees()', () => {
    createBeforeHook();

    it('expect to revert when sender is not the operator', async () => {
      await expect(
        dao.connect(signers[0]).removeTokenLPFees(),
      ).to.be.revertedWith('MetaheroDAO#1');
    });

    it('expect to remove lp fees', async () => {
      const tx = await dao.connect(operator).removeTokenLPFees();

      expect(tx).to.emit(token, 'FeesUpdated');

      const { burnFees, lpFees, rewardsFees } = await token.settings();

      expect(burnFees.sender).to.equal(BURN_FEE.sender + LP_FEE.sender);
      expect(burnFees.recipient).to.equal(
        BURN_FEE.recipient + LP_FEE.recipient,
      );
      expect(lpFees.sender).to.equal(0);
      expect(lpFees.recipient).to.equal(0);
      expect(rewardsFees.sender).to.equal(REWARDS_FEE.sender);
      expect(rewardsFees.recipient).to.equal(REWARDS_FEE.recipient);
    });

    it('expect to revert when lp fees are removed', async () => {
      await expect(
        dao.connect(operator).removeTokenLPFees(),
      ).to.be.revertedWith('MetaheroDAO#6');
    });
  });

  context('excludeTokenAccount()', () => {
    createBeforeHook();

    it('expect to revert when sender is not the operator', async () => {
      await expect(
        dao
          .connect(signers[0])
          .excludeTokenAccount(randomAddress(), false, false),
      ).to.be.revertedWith('MetaheroDAO#1');
    });

    it('expect to exclude token account', async () => {
      const account = randomAddress();
      const tx = await dao
        .connect(operator)
        .excludeTokenAccount(account, true, true);

      expect(tx).to.emit(token, 'AccountExcluded');

      const { exists } = await token.getExcludedAccount(account);

      expect(exists).to.eq(true);
    });
  });

  context('createProposal()', () => {
    const totalHolding = 1000;
    let proposalCounter = 0;

    createBeforeHook({
      postBefore: async () => {
        await token.transfer(randomAddress(), totalHolding);
      },
    });

    it('expect to revert when sender is not the operator', async () => {
      await expect(
        dao.connect(signers[0]).createProposal('0x', 0, 0, 0),
      ).to.be.revertedWith('MetaheroDAO#1');
    });

    it('expect to revert when `ends in` is higher than `starts in`', async () => {
      await expect(
        dao.connect(operator).createProposal('0x', 0, 0, 0),
      ).to.be.revertedWith('MetaheroDAO#7');
    });

    it('expect to revert when period is too short', async () => {
      await expect(
        dao.connect(operator).createProposal('0x', 0, MIN_VOTING_PERIOD - 1, 0),
      ).to.be.revertedWith('MetaheroDAO#8');
    });

    it('expect to revert on invalid votes min percentage', async () => {
      await expect(
        dao
          .connect(operator)
          .createProposal('0x', 0, MIN_VOTING_PERIOD + 1, 200),
      ).to.be.revertedWith('MetaheroDAO#9');
    });

    it('expect to create proposal', async () => {
      const timestamp = await setNextBlockTimestamp();
      const startsIn = 0;
      const endsIn = MIN_VOTING_PERIOD + 1;
      const tx = await dao
        .connect(operator)
        .createProposal('0x', startsIn, endsIn, 0);

      expect(tx)
        .to.emit(dao, 'ProposalCreated')
        .withArgs(
          ++proposalCounter,
          await dao.getCurrentSnapshotId(),
          '0x',
          startsIn + timestamp,
          endsIn + timestamp,
          0,
          0,
        );
    });

    it('expect to create proposal with votes min percentage', async () => {
      const timestamp = await setNextBlockTimestamp();
      const startsIn = 0;
      const endsIn = MIN_VOTING_PERIOD + 1;
      const votesMinPercentage = 10;
      const tx = await dao
        .connect(operator)
        .createProposal('0x', startsIn, endsIn, votesMinPercentage);

      expect(tx)
        .to.emit(dao, 'ProposalCreated')
        .withArgs(
          ++proposalCounter,
          await dao.getCurrentSnapshotId(),
          '0x',
          startsIn + timestamp,
          endsIn + timestamp,
          votesMinPercentage,
          (totalHolding * votesMinPercentage) / 100,
        );
    });
  });

  context('processProposal()', () => {
    const proposals: Partial<{
      processed: number;
      withData: number;
      withIncorrectData: number;
      unfinished: number;
    }> = {};
    const voterWeight = 1000;
    let proposalCounter = 0;

    createBeforeHook({
      postBefore: async () => {
        const voter = signers[0];

        await token.transfer(voter.address, voterWeight);

        // processed
        {
          const timestamp = await setNextBlockTimestamp();

          proposals.processed = ++proposalCounter;

          await dao
            .connect(operator)
            .createProposal('0x', 0, MIN_VOTING_PERIOD, 0);

          await setNextBlockTimestamp(timestamp + MIN_VOTING_PERIOD);

          await dao.connect(operator).processProposal(proposals.processed);
        }

        // with incorrect data
        {
          proposals.withIncorrectData = ++proposalCounter;

          const callData = token.interface.encodeFunctionData('transfer', [
            randomAddress(),
            '0x11',
          ]);

          const timestamp = await setNextBlockTimestamp();

          await dao
            .connect(operator)
            .createProposal(callData, 0, MIN_VOTING_PERIOD, 0);

          await dao
            .connect(voter)
            .submitVote(proposals.withIncorrectData, VOTES.Y);

          await setNextBlockTimestamp(timestamp + MIN_VOTING_PERIOD);
        }

        // with data
        {
          proposals.withData = ++proposalCounter;

          const callData = token.interface.encodeFunctionData(
            'excludeAccount',
            [randomAddress(), true, true],
          );

          const timestamp = await setNextBlockTimestamp();

          await dao
            .connect(operator)
            .createProposal(callData, 0, MIN_VOTING_PERIOD, 0);

          await dao.connect(voter).submitVote(proposals.withData, VOTES.Y);

          await setNextBlockTimestamp(timestamp + MIN_VOTING_PERIOD);
        }

        // unfinished
        proposals.unfinished = ++proposalCounter;

        await dao.connect(operator).createProposal('0x', 0, 1000000, 0);
      },
    });

    it("expect to revert when proposal doesn't exist", async () => {
      await expect(
        dao.connect(signers[0]).processProposal(proposalCounter + 1),
      ).to.be.revertedWith('MetaheroDAO#10');
    });

    it('expect to revert when proposal is not finished yet', async () => {
      await expect(
        dao.connect(signers[0]).processProposal(proposals.unfinished),
      ).to.be.revertedWith('MetaheroDAO#11');
    });

    it('expect to revert when proposal is already processed', async () => {
      await expect(
        dao.connect(signers[0]).processProposal(proposals.processed),
      ).to.be.revertedWith('MetaheroDAO#12');
    });

    it('expect to revert on proposal token call failed', async () => {
      await expect(
        dao.connect(signers[0]).processProposal(proposals.withIncorrectData),
      ).to.be.revertedWith('MetaheroDAO#13');
    });

    it('expect to process proposal with token call', async () => {
      const tx = await dao
        .connect(signers[0])
        .processProposal(proposals.withData);

      expect(tx).to.emit(token, 'AccountExcluded');

      expect(tx)
        .to.emit(dao, 'ProposalProcessed')
        .withArgs(proposals.withData, voterWeight, 0);
    });
  });

  context('submitVote()', () => {
    const proposals: Partial<{
      notStarted: number;
      finished: number;
      unfinished: number;
    }> = {};

    let voterY: Signer;
    let voterN: Signer;
    let proposalCounter = 0;

    createBeforeHook({
      postBefore: async () => {
        [voterY, voterN] = signers;

        await token.transfer(voterY.address, 1000);
        await token.transfer(voterN.address, 1000);

        // not started
        proposals.notStarted = ++proposalCounter;

        await dao
          .connect(operator)
          .createProposal('0x', 100000, MIN_VOTING_PERIOD + 100000, 0);

        // finished
        {
          proposals.finished = ++proposalCounter;

          const timestamp = await setNextBlockTimestamp();

          await dao
            .connect(operator)
            .createProposal('0x', 0, MIN_VOTING_PERIOD, 0);

          await setNextBlockTimestamp(timestamp + MIN_VOTING_PERIOD);
        }

        // unfinished
        proposals.unfinished = ++proposalCounter;

        await dao.connect(operator).createProposal('0x', 0, 1000000, 0);
      },
    });

    it("expect to revert when proposal doesn't exist", async () => {
      await expect(
        dao.connect(signers[0]).submitVote(proposalCounter + 1, 0),
      ).to.be.revertedWith('MetaheroDAO#14');
    });

    it("expect to revert when proposal doesn't start", async () => {
      await expect(
        dao.connect(signers[0]).submitVote(proposals.notStarted, 0),
      ).to.be.revertedWith('MetaheroDAO#15');
    });

    it('expect to revert when proposal finished', async () => {
      await expect(
        dao.connect(signers[0]).submitVote(proposals.finished, 0),
      ).to.be.revertedWith('MetaheroDAO#16');
    });

    it('expect to revert on invalid vote', async () => {
      await expect(
        dao.connect(signers[0]).submitVote(proposals.unfinished, 0),
      ).to.be.revertedWith('MetaheroDAO#17');
    });

    it('expect to revert on zero weight voter', async () => {
      await expect(
        dao.connect(signers[3]).submitVote(proposals.unfinished, VOTES.Y),
      ).to.be.revertedWith('MetaheroDAO#19');
    });

    it('expect to submit yes vote', async () => {
      const tx = await dao
        .connect(voterY)
        .submitVote(proposals.unfinished, VOTES.Y);

      expect(tx)
        .to.emit(dao, 'VoteSubmitted')
        .withArgs(proposals.unfinished, voterY.address, VOTES.Y);
    });

    it('expect to submit no vote', async () => {
      const tx = await dao
        .connect(voterN)
        .submitVote(proposals.unfinished, VOTES.N);

      expect(tx)
        .to.emit(dao, 'VoteSubmitted')
        .withArgs(proposals.unfinished, voterN.address, VOTES.N);
    });

    it('expect to revert when vote was already submitted', async () => {
      await expect(
        dao.connect(voterY).submitVote(proposals.unfinished, VOTES.N),
      ).to.be.revertedWith('MetaheroDAO#18');
    });
  });

  context('getProposal()', () => {
    let timestamp: number;
    const callData = '0x121212';

    createBeforeHook({
      postBefore: async () => {
        timestamp = await setNextBlockTimestamp();

        await dao
          .connect(operator)
          .createProposal(callData, 0, MIN_VOTING_PERIOD, 0);
      },
    });

    it('expect to return proposal', async () => {
      const proposal = await dao.getProposal(1);

      expect(proposal.snapshotId).to.eq(1);
      expect(proposal.callData).to.eq(callData);
      expect(proposal.startsAt).to.eq(timestamp);
      expect(proposal.endsAt).to.eq(timestamp + MIN_VOTING_PERIOD);
    });
  });

  context('getMemberProposalVote()', () => {
    let voter: Signer;

    createBeforeHook({
      postBefore: async () => {
        voter = signers[0];

        await token.transfer(voter.address, 1000);

        await dao
          .connect(operator)
          .createProposal('0x', 0, MIN_VOTING_PERIOD, 0);

        await dao.connect(voter).submitVote(1, VOTES.Y);
      },
    });

    it('expect to return member proposal vote', async () => {
      expect(await dao.getMemberProposalVote(voter.address, 1)).to.eq(VOTES.Y);
    });
  });

  context('getSnapshotIdAt()', () => {
    let timestamp: number;

    createBeforeHook({
      postBefore: async () => {
        timestamp = await setNextBlockTimestamp();
      },
    });

    it('expect to correct snapshot id', async () => {
      expect(await dao.getSnapshotIdAt(timestamp - 10)).to.eq(0);
      expect(await dao.getSnapshotIdAt(timestamp)).to.eq(1);
    });
  });

  context('getMemberWeightOnSnapshot()', () => {
    const memberA = randomAddress();
    const memberAWeight = 1000000;
    const memberB = randomAddress();
    const memberBWeight = 900000;
    let timestamp: number;
    let currentSnapshotId: BigNumber;

    createBeforeHook({
      setTokenDao: false,
      postBefore: async () => {
        timestamp = await setNextBlockTimestamp();

        // produce rewards
        const member = signers[0];
        await token.transfer(member.address, memberAWeight);
        await token
          .connect(member)
          .transfer(randomAddress(), memberAWeight / 2);

        await token.transfer(memberA, memberAWeight);

        await token.setDAO(dao.address);

        timestamp = await setNextBlockTimestamp(timestamp + SNAPSHOT_WINDOW);

        await token.transfer(memberB, memberBWeight);

        currentSnapshotId = await dao.getCurrentSnapshotId();
      },
    });

    context('# before switching to the dao', () => {
      it('expect to return correct member weight', async () => {
        expect(
          await dao.getMemberWeightOnSnapshot(memberA, currentSnapshotId),
        ).to.eq(memberAWeight);
      });
    });

    context('# after switching to the dao', () => {
      context('# for current snapshot', () => {
        it('expect to return correct member weight', async () => {
          expect(
            await dao.getMemberWeightOnSnapshot(memberB, currentSnapshotId),
          ).to.eq(memberBWeight);
        });
      });

      context('# for next snapshot', () => {
        it('expect to return correct member weight', async () => {
          expect(
            await dao.getMemberWeightOnSnapshot(
              memberB,
              currentSnapshotId.add(5),
            ),
          ).to.eq(memberBWeight);
        });
      });

      context('# for previous snapshot', () => {
        it('expect to return correct member weight', async () => {
          expect(
            await dao.getMemberWeightOnSnapshot(
              memberB,
              currentSnapshotId.sub(1),
            ),
          ).to.eq(0);
        });
      });
    });
  });

  context('getTotalWeightOnSnapshot()', () => {
    const totalA = 10000;
    const totalB = 30000;
    let timestamp: number;
    let currentSnapshotId: BigNumber;

    createBeforeHook({
      setTokenDao: false,
      postBefore: async () => {
        await token.transfer(randomAddress(), totalA);

        timestamp = await setNextBlockTimestamp();
        currentSnapshotId = await dao.getCurrentSnapshotId();
      },
    });

    context('# before switching to the dao', () => {
      it('expect to return correct total weight', async () => {
        expect(await dao.getTotalWeightOnSnapshot(currentSnapshotId)).to.eq(
          totalA,
        );
      });
    });

    context('# after switching to the dao', () => {
      before(async () => {
        await token.setDAO(dao.address);

        timestamp = await setNextBlockTimestamp(timestamp + SNAPSHOT_WINDOW);

        await token.transfer(randomAddress(), totalB - totalA);

        currentSnapshotId = await dao.getCurrentSnapshotId();
      });

      context('# for current snapshot', () => {
        it('expect to return correct total weight', async () => {
          expect(await dao.getTotalWeightOnSnapshot(currentSnapshotId)).to.eq(
            totalB,
          );
        });
      });

      context('# for next snapshot', () => {
        it('expect to return correct total weight', async () => {
          expect(
            await dao.getTotalWeightOnSnapshot(currentSnapshotId.add(5)),
          ).to.eq(totalB);
        });
      });

      context('# for previous snapshot', () => {
        it('expect to return correct total weight', async () => {
          expect(
            await dao.getTotalWeightOnSnapshot(currentSnapshotId.sub(1)),
          ).to.eq(0);
        });
      });
    });
  });
});
