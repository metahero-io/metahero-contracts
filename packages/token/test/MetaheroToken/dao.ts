import { constants } from 'ethers';
import { ethers, helpers } from 'hardhat';
import { expect } from 'chai';
import { MetaheroToken, MetaheroDAOMock } from '../../typechain';
import { Signer, randomAddress } from '../helpers';

const { getSigners } = ethers;

const { deployContract } = helpers;

describe('MetaheroToken', () => {
  describe('# dao', () => {
    const ZERO_FEE = {
      sender: 0,
      recipient: 0,
    };
    const TOTAL_SUPPLY = 100000;

    let signers: Signer[];
    let token: MetaheroToken;
    let dao: MetaheroDAOMock;

    const createBeforeHook = (
      options: { useDAOMock?: boolean; postBefore?: () => Promise<void> } = {},
    ) => {
      const { useDAOMock, postBefore } = {
        useDAOMock: false,
        ...options,
      };
      before(async () => {
        [, ...signers] = await getSigners();

        token = await deployContract('MetaheroToken');

        await token.initialize(
          ZERO_FEE,
          ZERO_FEE,
          ZERO_FEE,
          0,
          constants.AddressZero,
          constants.AddressZero,
          TOTAL_SUPPLY,
          [],
        );

        await token.setPresaleAsFinished();

        if (useDAOMock) {
          dao = await deployContract('MetaheroDAOMock');

          await token.setDAO(dao.address);
        }

        if (postBefore) {
          await postBefore();
        }
      });
    };

    context('setDAO()', () => {
      createBeforeHook();

      it('expect to revert when sender is not the owner', async () => {
        await expect(
          token.connect(signers[0]).setDAO(randomAddress()),
        ).to.be.revertedWith('Owned#1');
      });

      it('expect to revert when sender is not the owner', async () => {
        await expect(token.setDAO(constants.AddressZero)).to.be.revertedWith(
          'MetaheroToken#4',
        );
      });

      it('expect to set new dao address', async () => {
        const dao = randomAddress();
        const tx = await token.setDAO(dao);

        expect(tx).to.emit(token, 'DAOUpdated').withArgs(dao);
        expect(tx).to.emit(token, 'OwnerUpdated').withArgs(dao);
      });
    });

    context('updateFees()', () => {
      let dao: Signer;

      createBeforeHook({
        postBefore: async () => {
          dao = signers.pop();

          await token.setDAO(dao.address);
        },
      });

      it('expect to revert when sender is not the dao', async () => {
        await expect(
          token.updateFees(ZERO_FEE, ZERO_FEE, ZERO_FEE),
        ).to.be.revertedWith('MetaheroToken#1');
      });

      it('expect to revert when the total fee is too high', async () => {
        await expect(
          token
            .connect(dao)
            .updateFees(ZERO_FEE, ZERO_FEE, { sender: 30, recipient: 1 }),
        ).to.be.revertedWith('MetaheroToken#26');
      });

      it('expect to update fees', async () => {
        const tx = await token
          .connect(dao)
          .updateFees(ZERO_FEE, ZERO_FEE, ZERO_FEE);

        expect(tx).to.emit(token, 'FeesUpdated');
      });
    });

    context('# with dao mock', () => {
      let totalWeight = 0;

      createBeforeHook({
        useDAOMock: true,
      });

      context('_updateHoldingBalance()', () => {
        let member: Signer;
        const amount = 1000;

        before(async () => {
          member = signers.pop();
        });

        it('expect to sync dao member', async () => {
          const tx = await token.transfer(member.address, amount);

          totalWeight += amount;

          expect(tx)
            .to.emit(dao, 'MemberWeightSynced')
            .withArgs(member.address, amount);

          expect(tx).to.emit(dao, 'TotalWeightSynced').withArgs(totalWeight);
        });
      });

      context('_updateHoldingBalances()', () => {
        let memberA: Signer;
        let memberB: Signer;
        const amountA = 1000;
        const amountB = 500;

        before(async () => {
          memberA = signers.pop();
          memberB = signers.pop();

          await token.transfer(memberA.address, amountA);

          totalWeight += amountA;
        });

        it('expect to sync dao members', async () => {
          const tx = await token
            .connect(memberA)
            .transfer(memberB.address, amountB);

          expect(tx)
            .to.emit(dao, 'MemberWeightSynced')
            .withArgs(memberA.address, amountA - amountB);

          expect(tx)
            .to.emit(dao, 'MemberWeightSynced')
            .withArgs(memberB.address, amountB);

          expect(tx).to.emit(dao, 'TotalWeightSynced').withArgs(totalWeight);
        });
      });
    });
  });
});
