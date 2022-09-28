import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { helpers, ethers } from 'hardhat';
import { MerkleTree } from 'merkletreejs';
import { expect } from 'chai';
import {
  MetaheroLoyaltyTokenDistributor,
  MetaheroLoyaltyToken,
  ERC20PresetFixedSupply,
} from '../typechain';
import { YEAR_TIME } from './constants';

const {
  constants: { AddressZero },
  utils,
} = ethers;

const {
  deployContract,
  getSigners,
  processTransaction,
  randomAddress,
  resetSnapshots,
  revertSnapshot,
} = helpers;

describe('MetaheroLoyaltyTokenDistributor', () => {
  const paymentTokenTotalSupply = 1_000_000;
  const snapshotWindowMinLength = 10;
  const earlyWithdrawalTax = 5_000;

  let paymentToken: ERC20PresetFixedSupply;
  let loyaltyTokenDistributor: MetaheroLoyaltyTokenDistributor;
  let loyaltyToken: MetaheroLoyaltyToken;
  let deployer: SignerWithAddress;
  let account: SignerWithAddress;
  let signers: SignerWithAddress[];
  let merkleTree: MerkleTree;

  before(async () => {
    [deployer, account, ...signers] = await getSigners();

    merkleTree = new MerkleTree(
      signers.map(({ address }) => address),
      utils.keccak256,
      {
        hashLeaves: true,
        sortPairs: true,
      },
    );

    paymentToken = await deployContract(
      'ERC20PresetFixedSupply',
      '',
      '',
      paymentTokenTotalSupply,
      deployer.address,
    );

    loyaltyToken = await deployContract('MetaheroLoyaltyToken');

    loyaltyTokenDistributor = await deployContract(
      'MetaheroLoyaltyTokenDistributor',
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

      await processTransaction(
        loyaltyToken.initialize(
          paymentToken.address,
          loyaltyTokenDistributor.address,
          snapshotWindowMinLength,
          earlyWithdrawalTax,
          '',
        ),
      );

      if (options.initialize) {
        await processTransaction(
          loyaltyTokenDistributor.initialize(
            loyaltyToken.address,
            paymentToken.address,
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
        loyaltyTokenDistributor
          .connect(account)
          .initialize(randomAddress(), randomAddress()),
      ).revertedWith('MsgSenderIsNotTheDeployer()');
    });

    it('expect to revert when loyalty token is the zero address', async () => {
      await expect(
        loyaltyTokenDistributor.initialize(AddressZero, randomAddress()),
      ).revertedWith('LoyaltyTokenIsTheZeroAddress()');
    });

    it('expect to revert when payment token is the zero address', async () => {
      await expect(
        loyaltyTokenDistributor.initialize(randomAddress(), AddressZero),
      ).revertedWith('PaymentTokenIsTheZeroAddress()');
    });

    it('expect to initialize the contract', async () => {
      expect(await loyaltyTokenDistributor.initialized()).to.eq(false);

      const { tx } = await processTransaction(
        loyaltyTokenDistributor.initialize(
          loyaltyToken.address,
          paymentToken.address,
        ),
      );

      await expect(tx)
        .to.emit(loyaltyTokenDistributor, 'Initialized')
        .withArgs(loyaltyToken.address, paymentToken.address);

      expect(await loyaltyTokenDistributor.initialized()).to.eq(true);
    });

    it('expect to revert when contract is initialized', async () => {
      await expect(
        loyaltyTokenDistributor.initialize(
          loyaltyToken.address,
          paymentToken.address,
        ),
      ).revertedWith('AlreadyInitialized()');
    });
  });

  describe('# external functions (views)', () => {
    const invitationId = 2;
    const depositPower = 3;
    const minDeposit = 200;
    const maxDeposit = 2000;
    const minRewardsAPY = 2_000;
    const maxRewardsAPY = 20_000;
    const minWithdrawalLockTime = 2;
    const maxWithdrawalLockTime = 20;

    let treeRoot: string;
    let sender: SignerWithAddress;

    createBeforeHook();

    before(async () => {
      treeRoot = merkleTree.getHexRoot();
      sender = signers[0];

      await processTransaction(
        loyaltyTokenDistributor.addInvitation(
          invitationId,
          treeRoot,
          depositPower,
          minDeposit,
          maxDeposit,
          minRewardsAPY,
          maxRewardsAPY,
          minWithdrawalLockTime,
          maxWithdrawalLockTime,
        ),
      );

      await processTransaction(
        paymentToken
          .connect(sender)
          .approve(loyaltyTokenDistributor.address, minDeposit),
      );

      await processTransaction(
        paymentToken.transfer(sender.address, minDeposit),
      );

      await processTransaction(
        loyaltyTokenDistributor
          .connect(sender)
          .useInvitation(
            invitationId,
            minDeposit,
            minWithdrawalLockTime,
            merkleTree.getHexProof(utils.keccak256(sender.address)),
          ),
      );
    });

    describe('getDistributionState()', () => {
      it('expect return correct distribution state', async () => {
        const output = await loyaltyTokenDistributor.getDistributionState();

        expect(output).eq(0);
      });
    });

    describe('getInvitation()', () => {
      it('expect return correct invitation', async () => {
        const output = await loyaltyTokenDistributor.getInvitation(
          invitationId,
        );

        expect(output.treeRoot).eq(treeRoot);
        expect(output.depositPower).eq(depositPower);
        expect(output.minDeposit).eq(minDeposit);
        expect(output.maxDeposit).eq(maxDeposit);
        expect(output.minRewardsAPY).eq(minRewardsAPY);
        expect(output.maxRewardsAPY).eq(maxRewardsAPY);
        expect(output.minWithdrawalLockTime).eq(minWithdrawalLockTime);
        expect(output.maxWithdrawalLockTime).eq(maxWithdrawalLockTime);
      });
    });

    describe('getInvitations()', () => {
      it('expect return invitations', async () => {
        const output = await loyaltyTokenDistributor.getInvitations([
          invitationId,
          invitationId,
        ]);

        for (let index = 0; index < 2; index++) {
          expect(output[index].treeRoot).eq(treeRoot);
          expect(output[index].depositPower).eq(depositPower);
          expect(output[index].minDeposit).eq(minDeposit);
          expect(output[index].maxDeposit).eq(maxDeposit);
          expect(output[index].minRewardsAPY).eq(minRewardsAPY);
          expect(output[index].maxRewardsAPY).eq(maxRewardsAPY);
          expect(output[index].minWithdrawalLockTime).eq(minWithdrawalLockTime);
          expect(output[index].maxWithdrawalLockTime).eq(maxWithdrawalLockTime);
        }
      });
    });

    describe('isInvitationInUse()', () => {
      it('expect return true when is in use', async () => {
        expect(
          await loyaltyTokenDistributor.isInvitationInUse(
            invitationId,
            sender.address,
          ),
        ).eq(true);
      });

      it('expect return false when is not in use', async () => {
        expect(
          await loyaltyTokenDistributor.isInvitationInUse(
            invitationId,
            randomAddress(),
          ),
        ).eq(false);
      });
    });
  });

  describe('# external functions', () => {
    describe('setDistributionState()', () => {
      createBeforeHook();

      it('expect to revert when msg.sender is not the contract owner', async () => {
        await expect(
          loyaltyTokenDistributor.connect(account).setDistributionState(0),
        ).revertedWith('MsgSenderIsNotTheOwner()');
      });

      it('expect to pause distribution', async () => {
        const { tx } = await processTransaction(
          loyaltyTokenDistributor.setDistributionState(1),
        );

        await expect(tx)
          .to.emit(loyaltyTokenDistributor, 'DistributionStateUpdated')
          .withArgs(1);
      });

      it('expect to finish distribution', async () => {
        const { tx } = await processTransaction(
          loyaltyTokenDistributor.setDistributionState(2),
        );

        await expect(tx)
          .to.emit(loyaltyTokenDistributor, 'DistributionStateUpdated')
          .withArgs(2);
      });

      it('expect to revert when distribution is finished', async () => {
        await expect(
          loyaltyTokenDistributor.setDistributionState(0),
        ).revertedWith('DistributionIsFinished()');
      });
    });

    describe('releaseRewards()', () => {
      createBeforeHook();

      it('expect to revert when msg.sender is not the contract owner', async () => {
        await expect(
          loyaltyTokenDistributor.connect(account).releaseRewards(),
        ).revertedWith('MsgSenderIsNotTheOwner()');
      });

      it('expect to revert when when there is no rewards to release', async () => {
        await expect(loyaltyTokenDistributor.releaseRewards()).revertedWith(
          'NoRewardsToRelease()',
        );
      });

      describe('# after increasing rewards', () => {
        const rewards = 1000;

        before(async () => {
          await processTransaction(
            paymentToken.transfer(loyaltyTokenDistributor.address, rewards),
          );
        });

        it('expect to release rewards', async () => {
          const { tx } = await processTransaction(
            loyaltyTokenDistributor.releaseRewards(),
          );

          await expect(tx)
            .to.emit(loyaltyTokenDistributor, 'RewardsReleased')
            .withArgs(rewards);
        });
      });
    });

    describe('addInvitation()', () => {
      const existingInvitationId = 100;
      const invitationId = 1;
      const depositPower = 1;
      const minDeposit = 100;
      const maxDeposit = 1000;
      const minRewardsAPY = 1_000;
      const maxRewardsAPY = 10_000;
      const minWithdrawalLockTime = 1;
      const maxWithdrawalLockTime = 10;
      let treeRoot: string;

      createBeforeHook();

      before(async () => {
        treeRoot = merkleTree.getHexRoot();

        await processTransaction(
          loyaltyTokenDistributor.addInvitation(
            existingInvitationId,
            treeRoot,
            1,
            1,
            2,
            1,
            2,
            1,
            2,
          ),
        );
      });

      it('expect to revert when msg.sender is not the contract owner', async () => {
        await expect(
          loyaltyTokenDistributor
            .connect(account)
            .addInvitation(
              invitationId,
              treeRoot,
              depositPower,
              minDeposit,
              maxDeposit,
              minRewardsAPY,
              maxRewardsAPY,
              minWithdrawalLockTime,
              maxWithdrawalLockTime,
            ),
        ).revertedWith('MsgSenderIsNotTheOwner()');
      });

      it('expect to revert on invalid invitation id', async () => {
        await expect(
          loyaltyTokenDistributor.addInvitation(
            0,
            treeRoot,
            depositPower,
            minDeposit,
            maxDeposit,
            minRewardsAPY,
            maxRewardsAPY,
            minWithdrawalLockTime,
            maxWithdrawalLockTime,
          ),
        ).revertedWith('InvalidInvitationId()');
      });

      it('expect to revert when invitation already exists', async () => {
        await expect(
          loyaltyTokenDistributor.addInvitation(
            existingInvitationId,
            treeRoot,
            depositPower,
            minDeposit,
            maxDeposit,
            minRewardsAPY,
            maxRewardsAPY,
            minWithdrawalLockTime,
            maxWithdrawalLockTime,
          ),
        ).revertedWith('InvitationAlreadyExists()');
      });

      it('expect to revert on invalid deposit power', async () => {
        await expect(
          loyaltyTokenDistributor.addInvitation(
            invitationId,
            treeRoot,
            0,
            minDeposit,
            maxDeposit,
            minRewardsAPY,
            maxRewardsAPY,
            minWithdrawalLockTime,
            maxWithdrawalLockTime,
          ),
        ).revertedWith('InvalidDepositPower()');
      });

      it('expect to revert on invalid min deposit', async () => {
        await expect(
          loyaltyTokenDistributor.addInvitation(
            invitationId,
            treeRoot,
            depositPower,
            0,
            maxDeposit,
            minRewardsAPY,
            maxRewardsAPY,
            minWithdrawalLockTime,
            maxWithdrawalLockTime,
          ),
        ).revertedWith('InvalidMinDeposit()');
      });

      it('expect to revert on invalid max deposit', async () => {
        await expect(
          loyaltyTokenDistributor.addInvitation(
            invitationId,
            treeRoot,
            depositPower,
            minDeposit,
            0,
            minRewardsAPY,
            maxRewardsAPY,
            minWithdrawalLockTime,
            maxWithdrawalLockTime,
          ),
        ).revertedWith('InvalidMaxDeposit()');
      });

      it('expect to revert on invalid max rewards APY', async () => {
        await expect(
          loyaltyTokenDistributor.addInvitation(
            invitationId,
            treeRoot,
            depositPower,
            minDeposit,
            maxDeposit,
            minRewardsAPY,
            0,
            minWithdrawalLockTime,
            maxWithdrawalLockTime,
          ),
        ).revertedWith('InvalidMaxRewardsAPY()');
      });

      it('expect to revert on invalid max rewards APY (when min rewards APY is zero)', async () => {
        await expect(
          loyaltyTokenDistributor.addInvitation(
            invitationId,
            treeRoot,
            depositPower,
            minDeposit,
            maxDeposit,
            0,
            maxRewardsAPY,
            minWithdrawalLockTime,
            maxWithdrawalLockTime,
          ),
        ).revertedWith('InvalidMaxRewardsAPY()');
      });

      it('expect to revert on invalid min withdrawal lock time', async () => {
        await expect(
          loyaltyTokenDistributor.addInvitation(
            invitationId,
            treeRoot,
            depositPower,
            minDeposit,
            maxDeposit,
            minRewardsAPY,
            maxRewardsAPY,
            0,
            maxWithdrawalLockTime,
          ),
        ).revertedWith('InvalidMinWithdrawalLockTime()');
      });

      it('expect to revert on invalid max withdrawal lock time', async () => {
        await expect(
          loyaltyTokenDistributor.addInvitation(
            invitationId,
            treeRoot,
            depositPower,
            minDeposit,
            maxDeposit,
            minRewardsAPY,
            maxRewardsAPY,
            minWithdrawalLockTime,
            0,
          ),
        ).revertedWith('InvalidMaxWithdrawalLockTime()');
      });

      it('expect to revert on invalid max withdrawal lock time (when min rewards APY is zero)', async () => {
        await expect(
          loyaltyTokenDistributor.addInvitation(
            invitationId,
            treeRoot,
            depositPower,
            minDeposit,
            maxDeposit,
            0,
            0,
            minWithdrawalLockTime,
            0,
          ),
        ).revertedWith('InvalidMaxWithdrawalLockTime()');
      });

      it('expect to add new invitation', async () => {
        const { tx } = await processTransaction(
          loyaltyTokenDistributor.addInvitation(
            invitationId,
            treeRoot,
            depositPower,
            minDeposit,
            maxDeposit,
            minRewardsAPY,
            maxRewardsAPY,
            minWithdrawalLockTime,
            maxWithdrawalLockTime,
          ),
        );

        await expect(tx)
          .to.emit(loyaltyTokenDistributor, 'InvitationAdded')
          .withArgs(
            invitationId,
            treeRoot,
            depositPower,
            minDeposit,
            maxDeposit,
            minRewardsAPY,
            maxRewardsAPY,
            minWithdrawalLockTime,
            maxWithdrawalLockTime,
          );
      });

      it('expect to add new invitation (with min rewards APY is zero)', async () => {
        const nextInvitationId = invitationId + 1;

        const { tx } = await processTransaction(
          loyaltyTokenDistributor.addInvitation(
            nextInvitationId,
            treeRoot,
            depositPower,
            minDeposit,
            maxDeposit,
            0,
            0,
            minWithdrawalLockTime,
            minWithdrawalLockTime,
          ),
        );

        await expect(tx)
          .to.emit(loyaltyTokenDistributor, 'InvitationAdded')
          .withArgs(
            nextInvitationId,
            treeRoot,
            depositPower,
            minDeposit,
            maxDeposit,
            0,
            0,
            minWithdrawalLockTime,
            minWithdrawalLockTime,
          );
      });
    });

    describe('removeInvitation()', () => {
      const invitationId = 1;

      createBeforeHook();

      before(async () => {
        await processTransaction(
          loyaltyTokenDistributor.addInvitation(
            invitationId,
            merkleTree.getHexRoot(),
            1,
            1,
            2,
            1,
            2,
            1,
            2,
          ),
        );
      });

      it('expect to revert when msg.sender is not the contract owner', async () => {
        await expect(
          loyaltyTokenDistributor
            .connect(account)
            .removeInvitation(invitationId),
        ).revertedWith('MsgSenderIsNotTheOwner()');
      });

      it('expect to revert on invalid invitation id', async () => {
        await expect(loyaltyTokenDistributor.removeInvitation(0)).revertedWith(
          'InvalidInvitationId()',
        );
      });

      it("expect to revert when invitation doesn't exist", async () => {
        await expect(loyaltyTokenDistributor.removeInvitation(2)).revertedWith(
          'InvitationDoesntExist()',
        );
      });

      it('expect to remove the invitation', async () => {
        const { tx } = await processTransaction(
          loyaltyTokenDistributor.removeInvitation(invitationId),
        );

        await expect(tx)
          .to.emit(loyaltyTokenDistributor, 'InvitationRemoved')
          .withArgs(invitationId);
      });
    });

    describe('useInvitation()', () => {
      const invitationId = 1;
      const depositPower = 1;
      const minDeposit = 100;
      const maxDeposit = 1000;
      const minRewardsAPY = 1_000;
      const maxRewardsAPY = 10_000;
      const minWithdrawalLockTime = 1;
      const maxWithdrawalLockTime = YEAR_TIME;
      let tokenId = 1;

      createBeforeHook();

      before(async () => {
        await processTransaction(
          loyaltyTokenDistributor.addInvitation(
            invitationId,
            merkleTree.getHexRoot(),
            depositPower,
            minDeposit,
            maxDeposit,
            minRewardsAPY,
            maxRewardsAPY,
            minWithdrawalLockTime,
            maxWithdrawalLockTime,
          ),
        );
      });

      it('expect to revert on invalid invitation id', async () => {
        await expect(
          loyaltyTokenDistributor.useInvitation(
            0,
            minDeposit,
            minWithdrawalLockTime,
            [],
          ),
        ).revertedWith('InvalidInvitationId()');
      });

      it("expect to revert when invitation doesn't exist", async () => {
        await expect(
          loyaltyTokenDistributor.useInvitation(
            100,
            minDeposit,
            minWithdrawalLockTime,
            [],
          ),
        ).revertedWith('InvitationDoesntExist()');
      });

      it('expect to revert on invalid deposit', async () => {
        await expect(
          loyaltyTokenDistributor.useInvitation(
            invitationId,
            minDeposit - 1,
            minWithdrawalLockTime,
            [],
          ),
        ).revertedWith('InvalidDeposit()');
      });

      it('expect to revert on invalid withdrawal lock time', async () => {
        await expect(
          loyaltyTokenDistributor.useInvitation(
            invitationId,
            minDeposit,
            minWithdrawalLockTime - 1,
            [],
          ),
        ).revertedWith('InvalidWithdrawalLockTime()');
      });

      it('expect to revert on invalid proof', async () => {
        await expect(
          loyaltyTokenDistributor.useInvitation(
            invitationId,
            minDeposit,
            minWithdrawalLockTime,
            [],
          ),
        ).revertedWith('InvalidInvitationProof()');
      });

      describe('# invitation #1', () => {
        let sender: SignerWithAddress;
        let proof: string[];

        before(async () => {
          sender = signers[0];
          proof = merkleTree.getHexProof(utils.keccak256(sender.address));

          await processTransaction(
            paymentToken
              .connect(sender)
              .approve(loyaltyTokenDistributor.address, minDeposit),
          );

          await processTransaction(
            paymentToken.transfer(sender.address, minDeposit),
          );
        });

        it('expect to use the invitation', async () => {
          const { tx } = await processTransaction(
            loyaltyTokenDistributor
              .connect(sender)
              .useInvitation(
                invitationId,
                minDeposit,
                minWithdrawalLockTime,
                proof,
              ),
          );

          await expect(tx)
            .to.emit(loyaltyTokenDistributor, 'InvitationUsed')
            .withArgs(invitationId, tokenId, sender.address);

          ++tokenId;
        });

        it('expect to revert when the invitation is used', async () => {
          await expect(
            loyaltyTokenDistributor
              .connect(sender)
              .useInvitation(
                invitationId,
                minDeposit,
                minWithdrawalLockTime,
                proof,
              ),
          ).revertedWith('InvitationAlreadyUsed()');
        });
      });

      describe('# invitation #2', () => {
        let sender: SignerWithAddress;
        let proof: string[];

        before(async () => {
          sender = signers[1];
          proof = merkleTree.getHexProof(utils.keccak256(sender.address));

          await processTransaction(
            paymentToken
              .connect(sender)
              .approve(loyaltyTokenDistributor.address, maxDeposit),
          );

          await processTransaction(
            paymentToken.transfer(sender.address, maxDeposit),
          );
        });

        it('expect to use the invitation', async () => {
          const { tx } = await processTransaction(
            loyaltyTokenDistributor
              .connect(sender)
              .useInvitation(
                invitationId,
                maxDeposit,
                maxWithdrawalLockTime,
                proof,
              ),
          );

          await expect(tx)
            .to.emit(loyaltyTokenDistributor, 'InvitationUsed')
            .withArgs(invitationId, tokenId, sender.address);

          ++tokenId;
        });
      });

      describe('# invitation #3', () => {
        let sender: SignerWithAddress;
        let proof: string[];

        before(async () => {
          sender = signers[2];
          proof = merkleTree.getHexProof(utils.keccak256(sender.address));

          await processTransaction(
            paymentToken
              .connect(sender)
              .approve(loyaltyTokenDistributor.address, maxDeposit),
          );

          await processTransaction(
            paymentToken.transfer(sender.address, maxDeposit),
          );

          await processTransaction(
            paymentToken.transfer(loyaltyTokenDistributor.address, maxDeposit),
          );
        });

        it('expect to use the invitation', async () => {
          const { tx } = await processTransaction(
            loyaltyTokenDistributor
              .connect(sender)
              .useInvitation(
                invitationId,
                maxDeposit,
                maxWithdrawalLockTime - 10,
                proof,
              ),
          );

          await expect(tx)
            .to.emit(loyaltyTokenDistributor, 'InvitationUsed')
            .withArgs(invitationId, tokenId, sender.address);

          ++tokenId;
        });
      });

      describe('# when paused', () => {
        before(async () => {
          await processTransaction(
            loyaltyTokenDistributor.setDistributionState(1),
          );
        });

        it('expect to revert', async () => {
          await expect(
            loyaltyTokenDistributor.useInvitation(100, 1, 1, []),
          ).revertedWith('DistributionIsNotReady()');
        });
      });
    });
  });
});
