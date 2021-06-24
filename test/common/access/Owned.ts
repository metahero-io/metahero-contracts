import { ethers, waffle } from 'hardhat';
import { expect } from 'chai';
import { constants } from 'ethers';
import OwnedMockArtifact from '../../../artifacts/OwnedMock.json';
import { OwnedMock } from '../../../typings';
import { randomAddress, Signer } from '../../helpers';

const { deployContract } = waffle;
const { getSigners } = ethers;

describe('Owned (using mock)', () => {
  let owner: Signer;
  let signers: Signer[];
  let owned: OwnedMock;

  before(async () => {
    [owner, ...signers] = await getSigners();

    owned = (await deployContract(owner, OwnedMockArtifact)) as OwnedMock;
  });

  context('owner()', () => {
    it('expect to return correct owner', async () => {
      expect(await owned.owner()).to.equal(owner.address);
    });
  });

  context('onlyOwner()', () => {
    it('expect to revert when sender is not the owner', async () => {
      const sender = signers.pop();

      await expect(owned.connect(sender).triggerOnlyOwner()).to.be.revertedWith(
        'Owned#1',
      );
    });

    it('expect to emit event when sender is the owner', async () => {
      const tx = await owned.connect(owner).triggerOnlyOwner();

      expect(tx).to.emit(owned, 'Triggered');
    });
  });

  context('setOwner()', () => {
    it('expect to revert when sender is not the owner', async () => {
      const sender = signers.pop();

      await expect(
        owned.connect(sender).setOwner(randomAddress()),
      ).to.be.revertedWith('Owned#1');
    });

    it('expect to revert when the new owner is zero address', async () => {
      await expect(owned.setOwner(constants.AddressZero)).to.be.revertedWith(
        'Owned#2',
      );
    });

    it('expect to revert when the new owner is the same as the current owner', async () => {
      await expect(owned.setOwner(owner.address)).to.be.revertedWith('Owned#3');
    });

    it('expect to set the new owner', async () => {
      const newOwner = signers.pop();

      const tx = await owned.setOwner(newOwner.address);

      expect(tx).to.emit(owned, 'OwnerUpdated').withArgs(newOwner.address);

      expect(await owned.owner()).to.equal(newOwner.address);

      owner = newOwner;
    });
  });
});
