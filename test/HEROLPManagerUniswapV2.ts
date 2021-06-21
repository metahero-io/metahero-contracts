import { ethers, waffle, knownContracts } from 'hardhat';
import { expect } from 'chai';
import { BigNumber, constants } from 'ethers';
import HEROTokenArtifact from '../artifacts/HEROToken.json';
import HEROLPManagerUniswapV2Artifact from '../artifacts/HEROLPManagerUniswapV2.json';
import {
  HEROToken,
  HEROLPManagerUniswapV2,
  ERC20,
  ERC20__factory as ERC20Factory,
  UniswapV2Pair,
  UniswapV2Pair__factory as UniswapV2PairFactory,
  UniswapV2Router02,
  UniswapV2Router02__factory as UniswapV2Router02Factory,
} from '../typings';
import { Signer, setNextBlockTimestamp, getBalance } from './helpers';

const { deployContract } = waffle;
const { getSigners } = ethers;

describe('HEROLPManagerUniswapV2', () => {
  const BURN_FEE = {
    sender: 0,
    recipient: 0,
  };
  const LP_FEE = {
    sender: 5,
    recipient: 5,
  };
  const REWARDS_FEE = {
    sender: 0,
    recipient: 0,
  };
  const ENABLE_BURN_LP_AT_VALUE = BigNumber.from('10');
  const TOTAL_SUPPLY = BigNumber.from('10000000000000');

  let owner: Signer;
  let token: HEROToken;
  let lpManager: HEROLPManagerUniswapV2;
  let wrappedNative: ERC20;
  let swapRouter: UniswapV2Router02;
  let swapTokenPair: UniswapV2Pair;
  let swapTokenAmount = TOTAL_SUPPLY.div(100);

  before(async () => {
    [owner] = await getSigners();

    token = (await deployContract(owner, HEROTokenArtifact)) as HEROToken;

    lpManager = (await deployContract(
      owner,
      HEROLPManagerUniswapV2Artifact,
    )) as HEROLPManagerUniswapV2;

    swapRouter = UniswapV2Router02Factory.connect(
      knownContracts.getAddress('PancakeSwapRouter'),
      owner,
    );

    await token.initialize(
      BURN_FEE,
      LP_FEE,
      REWARDS_FEE,
      lpManager.address,
      constants.AddressZero,
      TOTAL_SUPPLY,
      [],
    );

    await lpManager.initialize(
      ENABLE_BURN_LP_AT_VALUE,
      knownContracts.getAddress('BUSDToken'),
      token.address,
      swapRouter.address,
    );

    wrappedNative = ERC20Factory.connect(
      await swapRouter.WETH(), //
      owner,
    );

    swapTokenPair = UniswapV2PairFactory.connect(
      await lpManager.uniswapTokenPair(), //
      owner,
    );

    await token.excludeAccount(swapTokenPair.address, true);
    await token.excludeAccount(swapRouter.address, true);

    await token.finishPresale();
  });

  context('syncLP()', () => {
    const swapEthAmount = BigNumber.from(1000000);
    const amount = TOTAL_SUPPLY.div(2000);

    before(async () => {
      await token.approve(swapRouter.address, swapTokenAmount);

      const deadline = await setNextBlockTimestamp();

      await swapRouter.addLiquidityETH(
        token.address,
        swapTokenAmount,
        0,
        0,
        lpManager.address,
        deadline,
        {
          value: swapEthAmount,
        },
      );

      await token.transfer(lpManager.address, amount);
    });

    it('expect to increase total lp', async () => {
      await lpManager.syncLP();

      swapTokenAmount = swapTokenAmount.add(amount);

      expect(await token.balanceOf(swapTokenPair.address)).to.equal(
        swapTokenAmount.sub(await token.balanceOf(lpManager.address)),
      );
      expect(await wrappedNative.balanceOf(swapTokenPair.address)).to.equal(
        swapEthAmount.sub(await getBalance(lpManager.address)),
      );
    });
  });

  context('burnLP()', () => {
    it('expect to burn LP', async () => {
      const amount = swapTokenAmount.div(10000);

      await lpManager.burnLP(amount);
    });
  });
});
