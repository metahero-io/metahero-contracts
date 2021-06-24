import { ethers, waffle } from 'hardhat';
import { expect } from 'chai';
import InitializableMockArtifact from '../../../artifacts/InitializableMock.json';
import { InitializableMock } from '../../../typings';
import { Signer } from '../../helpers';

const { deployContract } = waffle;
const { getSigners } = ethers;

describe('Initializable (using mock)', () => {
  let initializer: Signer;
  let signers: Signer[];
  let initializable: InitializableMock;

  before(async () => {
    [initializer, ...signers] = await getSigners();
  });

  const createBeforeHook = () => {
    before(async () => {
      initializable = (await deployContract(
        initializer,
        InitializableMockArtifact,
      )) as InitializableMock;
    });
  };

  context('initialized()', () => {
    createBeforeHook();

    it('expect to return false when contract is not initialized', async () => {
      expect(await initializable.initialized()).to.be.false;
    });

    it('expect to return true when contract is initialized', async () => {
      await initializable.triggerOnlyInitializer();

      expect(await initializable.initialized()).to.be.true;
    });
  });

  context('onlyInitializer()', () => {
    createBeforeHook();

    it('expect to revert when sender is not the initializer', async () => {
      const sender = signers.pop();

      await expect(
        initializable.connect(sender).triggerOnlyInitializer(),
      ).to.be.revertedWith('Initializable#2');
    });

    it('expect to resolve when sender is the initializer', async () => {
      await initializable.triggerOnlyInitializer();
    });

    it('expect to revert when contract is initialized', async () => {
      await expect(initializable.triggerOnlyInitializer()).to.be.revertedWith(
        'Initializable#1',
      );
    });
  });
});
