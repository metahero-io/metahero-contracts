import { ethers, waffle } from 'hardhat';
import { expect } from 'chai';
import LockableMockArtifact from '../../../artifacts/LockableMock.json';
import { LockableMock } from '../../../typings';

const { deployContract } = waffle;
const { getSigners } = ethers;

describe('Lockable (using mock)', () => {
  let lockable: LockableMock;

  before(async () => {
    const [deployer] = await getSigners();

    lockable = (await deployContract(
      deployer,
      LockableMockArtifact,
    )) as LockableMock;
  });

  context('locked()', () => {
    it('expect to return true when contract is locked', async () => {
      await lockable.setLocked(true);

      expect(await lockable.locked()).to.be.true;
    });

    it('expect to return false when contract is unlocked', async () => {
      await lockable.setLocked(false);

      expect(await lockable.locked()).to.be.false;
    });
  });

  context('lock()', () => {
    it('expect not to emit event when contract is locked', async () => {
      await lockable.setLocked(true);

      const tx = await lockable.triggerLock();

      expect(tx).not.to.emit(lockable, 'Triggered');
    });

    it('expect to emit event when contract is unlocked', async () => {
      await lockable.setLocked(false);

      const tx = await lockable.triggerLock();

      expect(tx).to.emit(lockable, 'Triggered');
    });
  });

  context('lockOrThrowError()', () => {
    it('expect to revert when contract is locked', async () => {
      await lockable.setLocked(true);

      await expect(lockable.triggerLockOrThrowError()).to.be.revertedWith(
        'Lockable#1',
      );
    });

    it('expect to emit event when contract is unlocked', async () => {
      await lockable.setLocked(false);

      const tx = await lockable.triggerLockOrThrowError();

      expect(tx).to.emit(lockable, 'Triggered');
    });
  });
});
