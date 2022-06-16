import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { ethers, helpers } from 'hardhat';
import { expect } from 'chai';
import { OwnableMock } from '../../typechain';

const {
  constants: { AddressZero },
} = ethers;

const { deployContract, processTransaction, getSigners, randomAddress } =
  helpers;

describe('Ownable (using mock)', () => {
  let ownable: OwnableMock;
  let deployer: SignerWithAddress;
  let account: SignerWithAddress;

  before(async () => {
    [deployer, account] = await getSigners();

    ownable = await deployContract('OwnableMock');
  });

  describe('# modifiers', () => {
    describe('onlyOwner()', () => {
      it('expect to revert when msg.sender is not the owner', async () => {
        await expect(ownable.connect(account).testOnlyOwner()).revertedWith(
          'MsgSenderIsNotTheOwner()',
        );
      });

      it('expect to complete when msg.sender is the owner', async () => {
        await ownable.testOnlyOwner();
      });
    });
  });

  describe('# external functions (views)', () => {
    describe('getOwner()', () => {
      it('expect to return correct balance', async () => {
        expect(await ownable.getOwner()).to.eq(deployer.address);
      });
    });
  });

  describe('# external functions', () => {
    describe('setOwner()', () => {
      it('expect to revert when msg.sender is not the owner', async () => {
        await expect(
          ownable.connect(account).setOwner(randomAddress()),
        ).revertedWith('MsgSenderIsNotTheOwner()');
      });

      it('expect to revert when owner is the zero address', async () => {
        await expect(ownable.setOwner(AddressZero)).revertedWith(
          'OwnerIsTheZeroAddress()',
        );
      });

      it('expect to set a new owner', async () => {
        const owner = randomAddress();

        const { tx } = await processTransaction(ownable.setOwner(owner));

        await expect(tx).to.emit(ownable, 'OwnerUpdated').withArgs(owner);
      });
    });
  });
});
