import { ethers, waffle } from 'hardhat';
import { expect } from 'chai';
import { BigNumber, constants } from 'ethers';
import HEROTokenArtifact from '../artifacts/HEROToken.json';
import HEROLPManagerMockArtifact from '../artifacts/HEROLPManagerMock.json';
import { HEROToken, HEROLPManagerMock } from '../typings';
import { Signer, getBalance } from './helpers';

const { deployContract } = waffle;
const { getSigners } = ethers;

describe('HEROLPManager (using mock)', () => {
  const TOTAL_SUPPLY = BigNumber.from('10000000000000');

  let owner: Signer;
  let signers: Signer[];
  let token: HEROToken;
  let lpManager: HEROLPManagerMock;

  before(async () => {
    [owner, ...signers] = await getSigners();
  });

  const createBeforeHook = (
    initialize = true,
    postBefore?: () => Promise<void>,
  ) => {
    before(async () => {
      token = (await deployContract(owner, HEROTokenArtifact)) as HEROToken;

      lpManager = (await deployContract(
        owner,
        HEROLPManagerMockArtifact,
      )) as HEROLPManagerMock;

      await token.initialize(
        {
          sender: 0,
          recipient: 0,
        },
        {
          sender: 0,
          recipient: 0,
        },
        {
          sender: 0,
          recipient: 0,
        },
        constants.AddressZero,
        constants.AddressZero,
        TOTAL_SUPPLY,
        [lpManager.address],
      );

      if (initialize) {
        await lpManager.initialize(token.address);
      }

      if (postBefore) {
        await postBefore();
      }
    });
  };

  context('token()', () => {
    createBeforeHook(true);

    it('expect to return correct token', async () => {
      expect(await lpManager.token()).to.equal(token.address);
    });
  });

  context('receive()', () => {
    createBeforeHook(false);

    it('expect to increase contract balance', async () => {
      const sender = signers.pop();
      const value = 1000;

      await sender.sendTransaction({
        to: lpManager.address,
        value,
      });

      expect(await getBalance(lpManager)).to.equal(value);
    });
  });

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

  context('syncLP()', () => {
    const totalLP = 1000;

    createBeforeHook(true, async () => {
      await token.transfer(lpManager.address, totalLP);
    });

    it('expect not to sync LP when swap is locked', async () => {
      await lpManager.lockSwap();

      await lpManager.syncLP();

      const newTotalLP = await lpManager.totalLP();

      expect(newTotalLP).to.equal(0);
    });

    it('expect to sync LP when swap is unlocked', async () => {
      await lpManager.unlockSwap();

      await lpManager.syncLP();

      const newTotalLP = await lpManager.totalLP();

      expect(newTotalLP).to.equal(totalLP);
    });
  });

  context('burnLP()', () => {
    const totalLP = BigNumber.from(1000);

    createBeforeHook(true, async () => {
      await token.transfer(lpManager.address, totalLP);
    });

    it('expect to revert when sender is not the owner', async () => {
      const sender = signers.pop();

      await expect(lpManager.connect(sender).burnLP(1)).to.be.revertedWith(
        'Owned#1',
      );
    });

    it('expect to revert when amount is zero', async () => {
      await expect(lpManager.burnLP(0)).to.be.revertedWith('HEROLPManager#1');
    });

    it('expect to revert when swap is locked', async () => {
      await lpManager.lockSwap();

      await expect(lpManager.burnLP(1)).to.be.revertedWith('HEROLPManager#2');
    });

    it('expect to burn LP when swap is unlocked', async () => {
      await lpManager.unlockSwap();

      const amount = totalLP.div(2);

      await lpManager.burnLP(amount);

      const newTotalLP = await lpManager.totalLP();

      expect(newTotalLP).to.equal(totalLP.sub(amount));
      expect(await token.totalSupply()).to.equal(TOTAL_SUPPLY.sub(amount));
    });
    //
  });
});
