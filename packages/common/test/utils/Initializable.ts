import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { helpers } from 'hardhat';
import { expect } from 'chai';
import { InitializableMock } from '../../typechain';

const { getSigners, deployContract, processTransaction } = helpers;

describe('Initializable (using mock)', () => {
  let initializable: InitializableMock;
  let account: SignerWithAddress;

  before(async () => {
    [, account] = await getSigners();

    initializable = await deployContract('InitializableMock');
  });

  describe('initialize()', () => {
    it('expect to revert when msg.sender is not the deployer', async () => {
      await expect(initializable.connect(account).initialize()).revertedWith(
        'MsgSenderIsNotTheDeployer()',
      );
    });

    it('expect to initialize the contract', async () => {
      expect(await initializable.initialized()).to.eq(false);

      const { tx } = await processTransaction(initializable.initialize());

      await expect(tx).to.emit(initializable, 'Initialized');

      expect(await initializable.initialized()).to.eq(true);
    });

    it('expect to revert when contract is initialized', async () => {
      await expect(initializable.connect(account).initialize()).revertedWith(
        'AlreadyInitialized()',
      );
    });
  });
});
