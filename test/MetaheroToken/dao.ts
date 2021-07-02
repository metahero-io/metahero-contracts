import { constants } from 'ethers';
import { ethers, waffle } from 'hardhat';
import { expect } from 'chai';
import MetaheroTokenArtifact from '../../artifacts/MetaheroToken.json';
import MetaheroDAOMockArtifact from '../../artifacts/MetaheroDAOMock.json';
import { MetaheroToken, MetaheroDAOMock } from '../../typings';
import { Signer, randomAddress } from '../helpers';

const { deployContract } = waffle;
const { getSigners } = ethers;

describe('MetaheroToken', () => {
  describe('# dao', () => {
    const ZERO_FEE = {
      sender: 0,
      recipient: 0,
    };
    const TOTAL_SUPPLY = 100000;

    let owner: Signer;
    let signers: Signer[];
    let token: MetaheroToken;
    let dao: MetaheroDAOMock;

    const createBeforeHook = (useDAOMock = false) => {
      before(async () => {
        [owner, ...signers] = await getSigners();

        token = (await deployContract(
          owner,
          MetaheroTokenArtifact,
        )) as MetaheroToken;

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

        await token.finishPresale();

        if (useDAOMock) {
          dao = (await deployContract(
            owner,
            MetaheroDAOMockArtifact,
          )) as MetaheroDAOMock;

          await token.setDAO(dao.address);
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
      createBeforeHook();

      it('expect to revert when sender is not the dao', async () => {
        await expect(
          token.updateFees(ZERO_FEE, ZERO_FEE, ZERO_FEE),
        ).to.be.revertedWith('MetaheroToken#1');
      });

      it('expect to update fees', async () => {
        const dao = signers[0];
        await token.setDAO(dao.address);

        const tx = await token
          .connect(dao)
          .updateFees(ZERO_FEE, ZERO_FEE, ZERO_FEE);

        expect(tx).to.emit(token, 'FeesUpdated');
      });
    });

    context('# with dao mock', () => {
      let totalWeight = 0;

      createBeforeHook(true);

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
