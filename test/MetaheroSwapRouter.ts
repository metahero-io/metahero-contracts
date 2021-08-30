/* eslint-disable @typescript-eslint/no-unused-vars */
import { ethers, waffle } from 'hardhat';
import { expect } from 'chai';
import { constants } from 'ethers';
import MetaheroSwapRouterArtifact from '../artifacts/MetaheroSwapRouter.json';
import { MetaheroSwapRouter } from '../typings';
import { Signer, randomAddress } from './helpers';

const { deployContract } = waffle;
const { getSigners } = ethers;

describe('MetaheroSwapRouter', () => {
  let deployer: Signer;
  let signers: Signer[];
  let swapRouter: MetaheroSwapRouter;

  before(async () => {
    [deployer, ...signers] = await getSigners();
  });

  const createBeforeHook = (
    options: {
      initialize?: boolean;
      postBefore?: () => Promise<void>;
    } = {},
  ) => {
    const { initialize, postBefore } = {
      initialize: true,
      ...options,
    };

    before(async () => {
      swapRouter = (await deployContract(
        deployer,
        MetaheroSwapRouterArtifact,
      )) as MetaheroSwapRouter;

      if (initialize) {
        await swapRouter.initialize(
          randomAddress(), // TODO: switch to pancake swap
        );

        if (postBefore) {
          await postBefore();
        }
      }
    });
  };

  context('initialize()', () => {
    createBeforeHook({
      initialize: false,
    });

    it('expect to revert when factory is the zero address', async () => {
      await expect(
        swapRouter.initialize(constants.AddressZero),
      ).to.be.revertedWith('MetaheroSwapRouter#1');
    });

    it('expect to initialize the contract', async () => {
      const factory = randomAddress();

      const tx = await swapRouter.initialize(factory);

      expect(tx).to.emit(swapRouter, 'Initialized').withArgs(factory);
    });
  });
});
