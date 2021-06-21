import { ethers, waffle } from 'hardhat';
import { expect } from 'chai';
import { constants } from 'ethers';
import ControlledMockArtifact from '../../artifacts/ControlledMock.json';
import { ControlledMock } from '../../typings';
import { Signer, randomAddress } from '../helpers';

const { deployContract } = waffle;
const { getSigners } = ethers;

describe('Controlled (using mock)', () => {
  let deployer: Signer;
  let signers: Signer[];
  let controlled: ControlledMock;

  before(async () => {
    [deployer, ...signers] = await getSigners();

    controlled = (await deployContract(
      deployer,
      ControlledMockArtifact,
    )) as ControlledMock;
  });

  context('controller()', () => {
    const controller = randomAddress();

    before(async () => {
      await controlled.initializeController(controller);
    });

    it('expect to return correct controller', async () => {
      expect(await controlled.controller()).to.equal(controller);
    });
  });

  context('onlyController()', () => {
    let controller: Signer;

    before(async () => {
      controller = signers.pop();

      await controlled.initializeController(controller.address);
    });

    it('expect to revert when sender is not the controller', async () => {
      const sender = signers.pop();

      await expect(
        controlled.connect(sender).triggerOnlyController(),
      ).to.be.revertedWith('Controlled#1');
    });

    it('expect to resolve when sender is the controller', async () => {
      await controlled.connect(controller).triggerOnlyController();
    });
  });

  context('_initializeController()', () => {
    before(async () => {
      await controlled.initializeController(constants.AddressZero);
    });

    it('expect to initialize the contract', async () => {
      const controller = randomAddress();

      expect(await controlled.controller()).to.equal(constants.AddressZero);

      await controlled.initializeController(controller);

      expect(await controlled.controller()).to.equal(controller);
    });
  });

  context('_setController()', () => {
    let controller = randomAddress();

    before(async () => {
      await controlled.initializeController(controller);
    });

    it('expect to revert when the new controller is zero address', async () => {
      await expect(
        controlled.setController(constants.AddressZero),
      ).to.be.revertedWith('Controlled#2');
    });

    it('expect to revert when the new controller is the same as the current controller', async () => {
      await expect(controlled.setController(controller)).to.be.revertedWith(
        'Controlled#3',
      );
    });

    it('expect to set the new controller', async () => {
      const newController = randomAddress();

      const tx = await controlled.setController(newController);

      expect(tx)
        .to.emit(controlled, 'ControllerUpdated')
        .withArgs(newController);

      expect(await controlled.controller()).to.equal(newController);

      controller = newController;
    });
  });

  context('_removeController()', () => {
    it('expect to revert when the new controller is zero address', async () => {
      await controlled.initializeController(constants.AddressZero);

      await expect(controlled.removeController()).to.be.revertedWith(
        'Controlled#4',
      );
    });

    it('expect to remove the controller', async () => {
      const controller = randomAddress();
      await controlled.initializeController(controller);

      const tx = await controlled.removeController();

      expect(tx)
        .to.emit(controlled, 'ControllerUpdated')
        .withArgs(constants.AddressZero);

      expect(await controlled.controller()).to.equal(constants.AddressZero);
    });
  });
});
