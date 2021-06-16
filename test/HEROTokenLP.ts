import { ethers, waffle, knownContracts } from 'hardhat';
import { expect } from 'chai';
import { BigNumber } from 'ethers';
import HEROTokenLPMockArtifact from '../artifacts/HEROTokenLPMock.json';
import {
  HEROTokenLPMock,
  ERC20,
  ERC20__factory as ERC20Factory,
  UniswapV2Pair,
  UniswapV2Pair__factory as UniswapV2PairFactory,
  UniswapV2Router02,
  UniswapV2Router02__factory as UniswapV2Router02Factory,
} from '../typings';
import { Signer, setNextBlockTimestamp, getBalance } from './common';

const { deployContract } = waffle;
const { getSigners } = ethers;

describe('HEROTokenLP (using mock)', () => {
  const LP_FEE = {
    sender: 5,
    recipient: 5,
  };
  const REWARDS_FEE = {
    sender: 0,
    recipient: 0,
  };
  const TOTAL_SUPPLY = BigNumber.from('10000000000000');

  let deployer: Signer;
  let holders: Signer[];
  let token: HEROTokenLPMock;
  let wETH: ERC20;
  let swapPair: UniswapV2Pair;
  let swapRouter: UniswapV2Router02;

  before(async () => {
    [deployer, ...holders] = await getSigners();

    token = (await deployContract(
      deployer,
      HEROTokenLPMockArtifact,
    )) as HEROTokenLPMock;

    swapRouter = UniswapV2Router02Factory.connect(
      knownContracts.getAddress('SwapRouter'),
      deployer,
    );

    await token.initialize(
      LP_FEE, //
      REWARDS_FEE,
      TOTAL_SUPPLY,
      [],
      swapRouter.address,
    );

    wETH = ERC20Factory.connect(
      await swapRouter.WETH(), //
      deployer,
    );

    swapPair = UniswapV2PairFactory.connect(
      await token.swapPair(), //
      deployer,
    );

    await token.finishPresale();
  });

  context('_increaseTotalLP()', () => {
    const swapEthAmount = BigNumber.from(100000);
    let swapTokenAmount = TOTAL_SUPPLY.div(1000);

    before(async () => {
      await token.approve(swapRouter.address, swapTokenAmount);

      const deadline = await setNextBlockTimestamp();

      await swapRouter.addLiquidityETH(
        token.address,
        swapTokenAmount,
        0,
        0,
        token.address,
        deadline,
        {
          value: swapEthAmount,
        },
      );
    });

    it('expect to increase total lp', async () => {
      const recipient = holders[0];
      const amount = TOTAL_SUPPLY.div(2000);
      const lpFee = amount.mul(LP_FEE.recipient).div(100);

      await token.transfer(recipient.address, amount);

      swapTokenAmount = swapTokenAmount.add(lpFee);

      expect(await token.balanceOf(swapPair.address)).to.equal(swapTokenAmount);
      expect(await wETH.balanceOf(swapPair.address)).to.equal(
        swapEthAmount.sub(await getBalance(token.address)),
      );
    });
  });
});
