import { ethers, waffle } from 'hardhat';
import { expect } from 'chai';
import { constants } from 'ethers';
import HEROLPManagerMockArtifact from '../../artifacts/HEROLPManagerMock.json';
import { HEROLPManagerMock } from '../../typings';
import { Signer } from '../helpers';

const { deployContract } = waffle;
const { getSigners } = ethers;

describe('HEROLPManager (using mock)', () => {
  let owner: Signer;
  let token: Signer;
  let signers: Signer[];
  let lpManager: HEROLPManagerMock;

  before(async () => {
    [owner, token, ...signers] = await getSigners();
  });

  const createBeforeHook = (initialize = true) => {
    before(async () => {
      lpManager = (await deployContract(
        owner,
        HEROLPManagerMockArtifact,
      )) as HEROLPManagerMock;

      if (initialize) {
        await lpManager.initialize(token.address);
      }
    });
  };

  context('_initialize()', () => {
    createBeforeHook(false);

    it('expect to revert on zero token', async () => {
      await expect(
        lpManager.initialize(constants.AddressZero),
      ).to.be.revertedWith('HEROLPManager#3');
    });

    it('expect to initialize the contract', async () => {
      expect(await lpManager.token()).to.equal(constants.AddressZero);

      await lpManager.initialize(token.address);

      expect(await lpManager.token()).to.equal(token.address);
    });
  });

  context('# after initialize', () => {
    createBeforeHook(true);

    context('token()', () => {
      it('expect to return correct token', async () => {
        expect(await lpManager.token()).to.equal(token.address);
      });
    });

    context('onlyToken()', () => {
      it('expect to revert when sender is not the token', async () => {
        const sender = signers.pop();

        await expect(
          lpManager.connect(sender).triggerOnlyToken(),
        ).to.be.revertedWith('HEROLPManager#1');
      });

      it('expect to emit event when sender is the token', async () => {
        const tx = await lpManager.connect(token).triggerOnlyToken();

        expect(tx).to.emit(lpManager, 'Triggered');
      });
    });

    context('syncLP()', () => {
      it('expect to revert when sender is not the token', async () => {
        await expect(lpManager.syncLP()).to.be.revertedWith('HEROLPManager#1');
      });

      it('expect not to sync LP when swap is locked', async () => {
        await lpManager.setLocked(true);

        const tx = await lpManager.connect(token).syncLP();

        expect(tx).not.to.emit(lpManager, 'LPSynced');
      });

      it('expect to sync LP when swap is unlocked', async () => {
        await lpManager.setLocked(false);

        const tx = await lpManager.connect(token).syncLP();

        expect(tx).to.emit(lpManager, 'LPSynced');
      });
    });

    context('burnLP()', () => {
      it('expect to revert when sender is not the owner', async () => {
        const sender = signers.pop();

        await expect(lpManager.connect(sender).burnLP(1)).to.be.revertedWith(
          'Owned#1',
        );
      });

      it('expect to revert when amount is zero', async () => {
        await expect(lpManager.burnLP(0)).to.be.revertedWith('HEROLPManager#2');
      });

      it('expect to revert when swap is locked', async () => {
        await lpManager.setLocked(true);

        await expect(lpManager.burnLP(1)).to.be.revertedWith('Lockable#1');
      });

      it('expect to burn LP when swap is unlocked', async () => {
        const amount = 1000;
        await lpManager.setLocked(false);

        const tx = await lpManager.burnLP(amount);

        expect(tx).to.emit(lpManager, 'LPBurnt').withArgs(amount);
      });
    });
  });
});
