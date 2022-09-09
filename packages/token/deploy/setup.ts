import { DeployFunction } from 'hardhat-deploy/types';
import { BigNumber, constants } from 'ethers';

const func: DeployFunction = async (hre) => {
  const {
    deployments: { get, read, execute, log },
    helpers: { getAccounts, isLocalNetwork },
    ethers: { utils, provider },
  } = hre;

  log();
  log('# setup');
  log();

  const [from] = await getAccounts();

  // finish presale

  if (await read('MetaheroToken', 'presaleFinished')) {
    log('MetaheroToken presale already finished');
  } else {
    await execute(
      'MetaheroToken',
      {
        from,
        log: true,
      },
      'setPresaleAsFinished',
    );
  }

  log();

  // set DAO

  if ((await read('MetaheroToken', 'dao')) !== constants.AddressZero) {
    log('MetaheroToken dao already set');
  } else {
    const { address: dao } = await get('MetaheroDAO');

    await execute(
      'MetaheroToken',
      {
        from,
        log: true,
      },
      'setDAO',
      dao,
    );
  }

  log();

  // set token lp fees

  const {
    lpFees,
  }: {
    lpFees: { sender: BigNumber; recipient: BigNumber };
  } = await read('MetaheroToken', 'settings');

  if (lpFees.sender.eq(0) && lpFees.sender.eq(0)) {
    log('MetaheroToken lp fees already removed');
  } else {
    await execute(
      'MetaheroDAO',
      {
        from,
        log: true,
      },
      'removeAllTokenFees',
    );
  }

  if (isLocalNetwork()) {
    log();

    const { timestamp } = await provider.getBlock('latest');
    const deadline = timestamp + 10;
    const { address: token } = await get('MetaheroToken');
    const { address: swapRouter } = await get('SwapRouter');
    const { address: busdToken } = await get('BUSDToken');
    const { address: wbnbToken } = await get('WBNBToken');

    const allPairsLength = (
      await read('SwapFactory', 'allPairsLength')
    ).toNumber();

    if (allPairsLength < 1) {
      await execute(
        'SwapFactory',
        {
          from,
          log: true,
        },
        'createPair',
        token,
        wbnbToken,
      );
    }

    if (allPairsLength < 2) {
      await execute(
        'SwapFactory',
        {
          from,
          log: true,
        },
        'createPair',
        wbnbToken,
        busdToken,
      );
    }

    await execute(
      'MetaheroToken',
      {
        from,
        log: true,
      },
      'approve',
      swapRouter,
      constants.MaxUint256,
    );

    await execute(
      'BUSDToken',
      {
        from,
        log: true,
      },
      'approve',
      swapRouter,
      constants.MaxUint256,
    );

    await execute(
      'BUSDToken',
      {
        from,
        log: true,
      },
      'setBalance',
      from,
      utils.parseEther('1000000'),
    );

    await execute(
      'SwapRouter',
      {
        from,
        log: true,
        value: utils.parseEther('10'),
      },
      'addLiquidityETH',
      token,
      utils.parseEther('100000'),
      utils.parseEther('100000'),
      utils.parseEther('10'),
      from,
      deadline,
    );

    await execute(
      'SwapRouter',
      {
        from,
        log: true,
        value: utils.parseEther('10'),
      },
      'addLiquidityETH',
      busdToken,
      utils.parseEther('100000'),
      utils.parseEther('100000'),
      utils.parseEther('10'),
      from,
      deadline,
    );
  }
};

func.tags = ['setup'];
func.dependencies = ['initialize'];

module.exports = func;
