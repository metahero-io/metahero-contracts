import { ethers, waffle } from 'hardhat';
import { expect } from 'chai';
import { constants } from 'ethers';
import ERC20MockArtifact from '../artifacts/ERC20Mock.json';
import MetaheroSwapRouterArtifact from '../artifacts/MetaheroSwapRouter.json';
import PancakeFactoryArtifact from '../artifacts/PancakeFactory.json';
import PancakeRouterArtifact from '../artifacts/PancakeRouter.json';
import WrappedNativeMockArtifact from '../artifacts/WrappedNativeMock.json';
import {
  IUniswapV2Router02,
  IWrappedNative,
  MetaheroSwapRouter,
  IUniswapV2Factory,
  ERC20Mock,
} from '../typings';
import { Signer, randomAddress, setNextBlockTimestamp } from './helpers';

const { deployContract } = waffle;
const { getSigners } = ethers;

describe('MetaheroSwapRouter', () => {
  let deployer: Signer;
  let signers: Signer[];
  let swapRouter: MetaheroSwapRouter;
  let uniswapRouter: IUniswapV2Router02;
  let wrappedNative: IWrappedNative;
  let factory: IUniswapV2Factory;
  let token: ERC20Mock;

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
      factory = (await deployContract(deployer, PancakeFactoryArtifact, [
        deployer.address,
      ])) as IUniswapV2Factory;

      wrappedNative = (await deployContract(
        deployer,
        WrappedNativeMockArtifact,
      )) as IWrappedNative;

      uniswapRouter = (await deployContract(deployer, PancakeRouterArtifact, [
        factory.address,
        wrappedNative.address,
      ])) as IUniswapV2Router02;

      swapRouter = (await deployContract(
        deployer,
        MetaheroSwapRouterArtifact,
      )) as MetaheroSwapRouter;

      token = (await deployContract(deployer, ERC20MockArtifact)) as ERC20Mock;

      if (initialize) {
        await swapRouter.initialize(token.address, uniswapRouter.address);
      }

      if (postBefore) {
        await postBefore();
      }
    });
  };

  context('initialize()', () => {
    createBeforeHook({
      initialize: false,
    });

    it('expect to revert when token is the zero address', async () => {
      await expect(
        swapRouter.initialize(constants.AddressZero, randomAddress()),
      ).to.be.revertedWith('MetaheroSwapRouter#1');
    });

    it('expect to revert when router is the zero address', async () => {
      await expect(
        swapRouter.initialize(randomAddress(), constants.AddressZero),
      ).to.be.revertedWith('MetaheroSwapRouter#2');
    });

    it('expect to initialize the contract', async () => {
      const tx = await swapRouter.initialize(
        token.address,
        uniswapRouter.address,
      );

      expect(tx)
        .to.emit(swapRouter, 'Initialized')
        .withArgs(token.address, factory.address, wrappedNative.address);
    });
  });

  context('addSupportedToken()', () => {
    const supportedToken = randomAddress();

    createBeforeHook({
      initialize: false,
      postBefore: async () => {
        await swapRouter.addSupportedToken(supportedToken);
      },
    });

    it('expect to revert when sender is not the owner', async () => {
      await expect(
        swapRouter.connect(signers[0]).addSupportedToken(constants.AddressZero),
      ).to.be.revertedWith('Owned#1');
    });

    it('expect to revert when token is the zero address', async () => {
      await expect(
        swapRouter.addSupportedToken(constants.AddressZero),
      ).to.be.revertedWith('MetaheroSwapRouter#6');
    });

    it('expect to revert when token is already supported', async () => {
      await expect(
        swapRouter.addSupportedToken(supportedToken),
      ).to.be.revertedWith('MetaheroSwapRouter#7');
    });

    it('expect to add supported token', async () => {
      const token = randomAddress();
      const tx = await swapRouter.addSupportedToken(token);

      expect(tx).to.emit(swapRouter, 'SupportedTokenAdded').withArgs(token);
    });
  });

  context('addSupportedTokens()', () => {
    createBeforeHook({
      initialize: false,
    });

    it('expect to revert when sender is not the owner', async () => {
      await expect(
        swapRouter
          .connect(signers[0])
          .addSupportedTokens([constants.AddressZero]),
      ).to.be.revertedWith('Owned#1');
    });

    it('expect to revert on empty tokens list', async () => {
      await expect(swapRouter.addSupportedTokens([])).to.be.revertedWith(
        'MetaheroSwapRouter#3',
      );
    });

    it('expect to add supported tokens', async () => {
      const tokens = [randomAddress(), randomAddress()];
      const tx = await swapRouter.addSupportedTokens(tokens);

      expect(tx).to.emit(swapRouter, 'SupportedTokenAdded').withArgs(tokens[0]);
      expect(tx).to.emit(swapRouter, 'SupportedTokenAdded').withArgs(tokens[1]);
    });
  });

  context('removeSupportedToken()', () => {
    const supportedToken = randomAddress();

    createBeforeHook({
      initialize: false,
      postBefore: async () => {
        await swapRouter.addSupportedToken(supportedToken);
      },
    });

    it('expect to revert when sender is not the owner', async () => {
      await expect(
        swapRouter
          .connect(signers[0])
          .removeSupportedToken(constants.AddressZero),
      ).to.be.revertedWith('Owned#1');
    });

    it('expect to revert when token is not supported', async () => {
      await expect(
        swapRouter.removeSupportedToken(randomAddress()),
      ).to.be.revertedWith('MetaheroSwapRouter#8');
    });

    it('expect to remove supported token', async () => {
      const tx = await swapRouter.removeSupportedToken(supportedToken);

      expect(tx)
        .to.emit(swapRouter, 'SupportedTokenRemoved')
        .withArgs(supportedToken);
    });
  });

  context('removeSupportedTokens()', () => {
    const supportedToken = randomAddress();

    createBeforeHook({
      initialize: false,
      postBefore: async () => {
        await swapRouter.addSupportedToken(supportedToken);
      },
    });

    it('expect to revert when sender is not the owner', async () => {
      await expect(
        swapRouter
          .connect(signers[0])
          .removeSupportedTokens([constants.AddressZero]),
      ).to.be.revertedWith('Owned#1');
    });

    it('expect to revert on empty tokens list', async () => {
      await expect(swapRouter.removeSupportedTokens([])).to.be.revertedWith(
        'MetaheroSwapRouter#4',
      );
    });

    it('expect to remove tokens', async () => {
      const tokens = [supportedToken];
      const tx = await swapRouter.removeSupportedTokens(tokens);

      expect(tx)
        .to.emit(swapRouter, 'SupportedTokenRemoved')
        .withArgs(tokens[0]);
    });
  });

  context('swapSupportedTokens()', () => {
    let supportedToken: ERC20Mock;
    let sender: Signer;

    createBeforeHook({
      initialize: true,
      postBefore: async () => {
        sender = signers.pop();

        supportedToken = (await deployContract(
          deployer,
          ERC20MockArtifact,
        )) as ERC20Mock;

        await swapRouter.addSupportedToken(supportedToken.address);

        await token.approve(
          uniswapRouter.address, //
          constants.MaxUint256,
        );

        await supportedToken.approve(
          uniswapRouter.address,
          constants.MaxUint256,
        );

        await wrappedNative.approve(
          uniswapRouter.address,
          constants.MaxUint256,
        );

        await token.setBalance(deployer.address, 100000);

        await supportedToken.setBalance(deployer.address, 100000);

        await wrappedNative.deposit({
          value: 100000,
        });

        await uniswapRouter.addLiquidity(
          supportedToken.address,
          wrappedNative.address,
          10000,
          10000,
          0,
          0,
          deployer.address,
          await setNextBlockTimestamp(),
        );

        await uniswapRouter.addLiquidity(
          token.address,
          wrappedNative.address,
          10000,
          10000,
          0,
          0,
          deployer.address,
          await setNextBlockTimestamp(),
        );

        await supportedToken.setBalance(sender.address, 100000);

        await supportedToken.connect(sender).approve(
          swapRouter.address, //
          constants.MaxUint256,
        );
      },
    });

    it('expect to revert on unsupported token', async () => {
      await expect(
        swapRouter.swapSupportedTokens(randomAddress(), 0, 0),
      ).to.be.revertedWith('MetaheroSwapRouter#5');
    });

    it('expect to revert when min amount out is too low', async () => {
      await expect(
        swapRouter
          .connect(sender)
          .swapSupportedTokens(supportedToken.address, 10, 10),
      ).to.be.revertedWith('MetaheroSwapRouter#9');
    });

    it('expect to swap token', async () => {
      await swapRouter
        .connect(sender)
        .swapSupportedTokens(supportedToken.address, 100, 10);

      expect(await token.balanceOf(sender.address)).to.gte(10);
    });
  });
});
