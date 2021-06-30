import { ethers, waffle } from 'hardhat';
import { expect } from 'chai';
import { constants } from 'ethers';
import MetaheroLPMMockArtifact from '../artifacts/MetaheroLPMMock.json';
import { MetaheroLPMMock } from '../typings';
import { Signer } from './helpers';

const { deployContract } = waffle;
const { getSigners } = ethers;

describe('MetaheroLPM (using mock)', () => {
  let owner: Signer;
  let token: Signer;
  let signers: Signer[];
  let lpm: MetaheroLPMMock;

  before(async () => {
    [owner, token, ...signers] = await getSigners();
  });

  const createBeforeHook = (initialize = true) => {
    before(async () => {
      lpm = (await deployContract(
        owner,
        MetaheroLPMMockArtifact,
      )) as MetaheroLPMMock;

      if (initialize) {
        await lpm.initialize(token.address);
      }
    });
  };

  context('_initialize()', () => {
    createBeforeHook(false);

    it('expect to revert on zero token', async () => {
      await expect(lpm.initialize(constants.AddressZero)).to.be.revertedWith(
        'MetaheroLPM#3',
      );
    });

    it('expect to initialize the contract', async () => {
      expect(await lpm.token()).to.equal(constants.AddressZero);

      await lpm.initialize(token.address);

      expect(await lpm.token()).to.equal(token.address);
    });
  });

  context('# after initialize', () => {
    createBeforeHook(true);

    context('token()', () => {
      it('expect to return correct token', async () => {
        expect(await lpm.token()).to.equal(token.address);
      });
    });

    context('onlyToken()', () => {
      it('expect to revert when sender is not the token', async () => {
        const sender = signers.pop();

        await expect(lpm.connect(sender).triggerOnlyToken()).to.be.revertedWith(
          'MetaheroLPM#1',
        );
      });

      it('expect to emit event when sender is the token', async () => {
        const tx = await lpm.connect(token).triggerOnlyToken();

        expect(tx).to.emit(lpm, 'Triggered');
      });
    });

    context('syncLP()', () => {
      it('expect to revert when sender is not the token', async () => {
        await expect(lpm.syncLP()).to.be.revertedWith('MetaheroLPM#1');
      });

      it('expect not to sync LP when swap is locked', async () => {
        await lpm.setLocked(true);

        const tx = await lpm.connect(token).syncLP();

        expect(tx).not.to.emit(lpm, 'LPSynced');
      });

      it('expect to sync LP when swap is unlocked', async () => {
        await lpm.setLocked(false);

        const tx = await lpm.connect(token).syncLP();

        expect(tx).to.emit(lpm, 'LPSynced');
      });
    });

    context('burnLP()', () => {
      it('expect to revert when sender is not the owner', async () => {
        const sender = signers.pop();

        await expect(lpm.connect(sender).burnLP(1)).to.be.revertedWith(
          'Owned#1',
        );
      });

      it('expect to revert when amount is zero', async () => {
        await expect(lpm.burnLP(0)).to.be.revertedWith('MetaheroLPM#2');
      });

      it('expect to revert when swap is locked', async () => {
        await lpm.setLocked(true);

        await expect(lpm.burnLP(1)).to.be.revertedWith('Lockable#1');
      });

      it('expect to burn LP when swap is unlocked', async () => {
        const amount = 1000;
        await lpm.setLocked(false);

        const tx = await lpm.burnLP(amount);

        expect(tx).to.emit(lpm, 'LPBurnt').withArgs(amount);
      });
    });
  });
});
