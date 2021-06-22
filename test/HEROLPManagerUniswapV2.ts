import { ethers, waffle, knownContracts } from 'hardhat';
import { expect } from 'chai';
import { BigNumber, constants, utils } from 'ethers';
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
import {
  Signer,
  setNextBlockTimestamp,
  getBalance,
  calcTxCost,
} from './helpers';

const { deployContract } = waffle;
const { getSigners } = ethers;

describe.skip('HEROLPManagerUniswapV2', () => {
  const BURN_FEE = {
    sender: 1,
    recipient: 1,
  };
  const LP_FEE = {
    sender: 3,
    recipient: 3,
  };
  const REWARDS_FEE = {
    sender: 1,
    recipient: 1,
  };
  const ENABLE_BURN_LP_AT_VALUE = BigNumber.from('10');
  const TOTAL_SUPPLY = utils.parseEther('10000000');

  let owner: Signer;
  let holders: Signer[];
  let token: HEROToken;
  let lpManager: HEROLPManagerUniswapV2;
  let wrappedNative: ERC20;
  let swapRouter: UniswapV2Router02;
  let swapTokenPair: UniswapV2Pair;
  let swapTokenAmount = TOTAL_SUPPLY.div(100);

  before(async () => {
    [owner, ...holders] = await getSigners();

    token = (await deployContract(owner, HEROTokenArtifact)) as HEROToken;

    lpManager = (await deployContract(
      owner,
      HEROLPManagerUniswapV2Artifact,
    )) as HEROLPManagerUniswapV2;

    swapRouter = UniswapV2Router02Factory.connect(
      knownContracts.getAddress('PancakeSwapRouter'),
      owner,
    );

    await lpManager.initialize(
      ENABLE_BURN_LP_AT_VALUE,
      knownContracts.getAddress('BUSDToken'),
      token.address,
      swapRouter.address,
    );

    swapTokenPair = UniswapV2PairFactory.connect(
      await lpManager.uniswapTokenPair(), //
      owner,
    );

    await token.initialize(
      BURN_FEE,
      LP_FEE,
      REWARDS_FEE,
      lpManager.address,
      constants.AddressZero,
      TOTAL_SUPPLY,
      [swapTokenPair.address, swapRouter.address],
    );

    await token.excludeAccount(swapTokenPair.address, true, true);

    wrappedNative = ERC20Factory.connect(
      await swapRouter.WETH(), //
      owner,
    );

    await token.finishPresale();
  });

  const addLiquidity = async (
    tokenAmount: BigNumber,
    nativeAmount: BigNumber,
  ) => {
    await token.approve(swapRouter.address, tokenAmount);

    const deadline = await setNextBlockTimestamp();

    await swapRouter.addLiquidityETH(
      token.address,
      tokenAmount,
      0,
      0,
      lpManager.address,
      deadline,
      {
        value: nativeAmount,
      },
    );
  };

  context('# demo', () => {
    it('expect to work', async () => {
      console.log();

      await addLiquidity(
        utils.parseEther('100000'), //
        utils.parseEther('10'),
      );

      const holder1 = holders[0];
      const holder2 = holders[1];

      const logBalances = async () => {
        console.log(
          'holder1 balance:',
          (await token.balanceOf(holder1.address)).toString(),
        );
        console.log(
          'holder2 balance:',
          (await token.balanceOf(holder2.address)).toString(),
        );
        console.log(
          'pair token balance:',
          (await token.balanceOf(swapTokenPair.address)).toString(),
        );
        console.log(
          'pair wrapped native balance:',
          (await wrappedNative.balanceOf(swapTokenPair.address)).toString(),
        );
        console.log(
          'lp manager token balance:',
          (await token.balanceOf(lpManager.address)).toString(),
        );
        console.log(
          'lp manager native balance:',
          (await getBalance(lpManager)).toString(),
        );
        console.log();
      };

      {
        console.log('# transfer exclude > holder1');

        const amount = utils.parseEther('100000');

        await token.transfer(holder1.address, amount);
        await token.transfer(holder1.address, amount);

        await logBalances();
      }

      {
        console.log('# holder1 > holder2');

        const amount = utils.parseEther('4000');

        await token.connect(holder1).approve(holder2.address, amount);

        await token
          .connect(holder2)
          .transferFrom(holder1.address, holder2.address, amount);

        await logBalances();
      }

      {
        console.log('# holder1 > holder2');

        const amount = utils.parseEther('1000');

        await token.connect(holder1).transfer(holder2.address, amount);

        await logBalances();
      }

      {
        console.log('# swap > holder2 (bnb > tokens)');

        const minAmount = utils.parseEther('900');
        const value = utils.parseEther('1');
        const deadline = await setNextBlockTimestamp();

        const tx = await swapRouter
          .connect(holder2)
          .swapExactETHForTokensSupportingFeeOnTransferTokens(
            minAmount,
            [wrappedNative.address, token.address],
            holder2.address,
            deadline,
            {
              value,
            },
          );

        const { gasUsed } = await tx.wait();

        await logBalances();

        console.log('gasUsed:', gasUsed.toString());
      }

      {
        console.log('# swap > holder2 (tokens > bnb)');

        const amount = utils.parseEther('900');
        const minAmount = 100;

        await token.connect(holder2).approve(swapRouter.address, amount);

        const deadline = await setNextBlockTimestamp();

        const preBalance = await getBalance(holder2);

        const tx = await swapRouter
          .connect(holder2)
          .swapExactTokensForETHSupportingFeeOnTransferTokens(
            amount,
            minAmount,
            [token.address, wrappedNative.address],
            holder2.address,
            deadline,
          );

        const { gasUsed } = await tx.wait();

        const txCost = await calcTxCost(tx);

        await logBalances();

        console.log('gasUsed:', gasUsed.toString());

        console.log('preBalance:', preBalance.toString());
        console.log('postBalance:', preBalance.add(txCost).toString());
      }
    });
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
