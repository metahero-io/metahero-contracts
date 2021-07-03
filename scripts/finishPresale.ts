import { BigNumber } from 'ethers';
import { ethers, deployments, knownContracts, getNetworkEnv } from 'hardhat';
import {
  IUniswapV2Router02__factory as UniswapV2Router02Factory,
  MetaheroPresale__factory as MetaheroPresaleFactory,
  MetaheroToken__factory as MetaheroTokenFactory,
} from '../typings';
import { logTx } from './helpers';

const { getSigners } = ethers;

const LP_NATIVE_EXTRA_AMOUNT = getNetworkEnv(
  'LP_NATIVE_EXTRA_AMOUNT',
  BigNumber.from('500000000000000000'), // 0.500000000000000000
);

const LP_TOKEN_AMOUNT = getNetworkEnv(
  'LP_TOKEN_AMOUNT',
  BigNumber.from('1000000000000000000000000000'), // 1,000,000,000.000000000000000000
);

async function main(): Promise<void> {
  const uniswapV2RouterAddress = knownContracts.getAddress('UniswapV2Router');
  const { address: presaleAddress } = await deployments.get('MetaheroPresale');
  const { address: tokenAddress } = await deployments.get('MetaheroToken');
  const { address: lpmAddress } = await deployments.get(
    'MetaheroLPMForUniswapV2',
  );
  const [owner] = await getSigners();

  if (
    !uniswapV2RouterAddress ||
    !presaleAddress ||
    !tokenAddress ||
    !lpmAddress ||
    !owner
  ) {
    return;
  }

  const uniswapV2Router = UniswapV2Router02Factory.connect(
    uniswapV2RouterAddress,
    owner,
  );
  const presale = MetaheroPresaleFactory.connect(presaleAddress, owner);
  const token = MetaheroTokenFactory.connect(tokenAddress, owner);

  const senderOldBalance = await owner.getBalance();

  if (senderOldBalance.lt(LP_NATIVE_EXTRA_AMOUNT)) {
    return;
  }

  const { totalCost } = await logTx(
    '[MetaheroPresale] Finishing presale',
    presale.finishPresale(),
  );

  const senderNewBalance = await owner.getBalance();

  const lpNativeAmount = senderNewBalance
    .sub(senderOldBalance.sub(totalCost))
    .add(LP_NATIVE_EXTRA_AMOUNT);

  if (lpNativeAmount.gt(0)) {
    await logTx(
      '[MetaheroToken] Approving Uniswap V2 router',
      token.approve(uniswapV2Router.address, LP_TOKEN_AMOUNT),
    );

    const deadline = Math.floor(Date.now() / 1000) + 60 * 60;

    await logTx(
      '[UniswapV2Router] Adding liquidity',
      uniswapV2Router.addLiquidityETH(
        token.address,
        LP_TOKEN_AMOUNT,
        0,
        lpNativeAmount,
        lpmAddress,
        deadline,
        {
          from: owner.address,
          value: lpNativeAmount.toHexString(),
        },
      ),
    );
  }

  if (!(await token.presaleFinished())) {
    await logTx(
      '[MetaheroToken] Finishing presale',
      token.setPresaleAsFinished(),
    );
  }
}

main().catch(console.error);
