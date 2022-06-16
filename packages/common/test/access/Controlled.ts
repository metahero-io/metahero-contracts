import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { ethers, helpers } from 'hardhat';
import { expect } from 'chai';
import { ControlledMock } from '../../typechain';

const {
  constants: { AddressZero },
} = ethers;

const { deployContract, processTransaction, getSigners, randomAddress } =
  helpers;

describe('Controlled (using mock)', () => {
  let controlled: ControlledMock;
  let account: SignerWithAddress;
  let controller: SignerWithAddress;

  before(async () => {
    [, account, controller] = await getSigners();

    controlled = await deployContract('ControlledMock');

    await processTransaction(controlled.setControllers([controller.address]));
  });

  describe('# modifiers', () => {
    describe('onlyOwner()', () => {
      it('expect to revert when msg.sender is not the controller', async () => {
        await expect(
          controlled.connect(account).testOnlyController(),
        ).revertedWith('MsgSenderIsNotTheController()');
      });

      it('expect to complete when msg.sender is the controller', async () => {
        await controlled.connect(controller).testOnlyController();
      });
    });
  });

  describe('# external functions', () => {
    const data = {
      existingController: randomAddress(),
      newController: randomAddress(),
    };

    before(async () => {
      await processTransaction(
        controlled.addController(data.existingController),
      );
    });

    describe('addController()', () => {
      it('expect to revert when msg.sender is not the owner', async () => {
        await expect(
          controlled.connect(account).addController(randomAddress()),
        ).revertedWith('MsgSenderIsNotTheOwner()');
      });

      it('expect to revert when controller is the zero address', async () => {
        await expect(controlled.addController(AddressZero)).revertedWith(
          'ControllerIsTheZeroAddress()',
        );
      });

      it('expect to revert when controller already exists', async () => {
        await expect(
          controlled.addController(data.existingController),
        ).revertedWith('ControllerAlreadyExists()');
      });

      it('expect to add a new controller', async () => {
        const { tx } = await processTransaction(
          controlled.addController(data.newController),
        );

        await expect(tx)
          .to.emit(controlled, 'ControllerAdded')
          .withArgs(data.newController);
      });
    });

    describe('removeController()', () => {
      it('expect to revert when msg.sender is not the owner', async () => {
        await expect(
          controlled.connect(account).removeController(randomAddress()),
        ).revertedWith('MsgSenderIsNotTheOwner()');
      });

      it("expect to revert when controller doesn't exist", async () => {
        await expect(controlled.removeController(randomAddress())).revertedWith(
          'ControllerDoesntExist()',
        );
      });

      it('expect to add a new controller', async () => {
        const { tx } = await processTransaction(
          controlled.removeController(data.existingController),
        );

        await expect(tx)
          .to.emit(controlled, 'ControllerRemoved')
          .withArgs(data.existingController);
      });
    });
  });

  describe('# internal functions', () => {
    describe('_setControllers()', () => {
      it('expect to omit zero address controllers', async () => {
        await processTransaction(controlled.setControllers([AddressZero]));

        expect(await controlled.hasController(AddressZero)).to.eq(false);
      });
    });
  });
});
