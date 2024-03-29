import { constants } from 'ethers';
import { DeployFunction } from 'hardhat-deploy/types';

const func: DeployFunction = async (hre) => {
  const {
    deployments: { get, read, execute, log },
    helpers: { getAccounts },
    processNetworkEnvs: {
      getEnvAsAmount, //
      getEnvAsNumber,
    },
  } = hre;

  log();
  log('# initialize');
  log();

  const [from] = await getAccounts();
  const { address: token } = await get('MetaheroToken');

  const { address: swapRouter } = await get('SwapRouter');
  const { address: busdToken } = await get('BUSDToken');

  const useLPM = !!(swapRouter && busdToken);

  // dao

  if (await read('MetaheroDAO', 'initialized')) {
    log('MetaheroDAO already initialized');
  } else {
    const MIN_VOTING_PERIOD = getEnvAsNumber(
      'dao.MIN_VOTING_PERIOD',
      24 * 60 * 60, // 1 day
    );

    const SNAPSHOT_WINDOW = getEnvAsNumber(
      'dao.SNAPSHOT_WINDOW',
      24 * 60 * 60, // 1 day
    );

    await execute(
      'MetaheroDAO',
      {
        from,
        log: true,
      },
      'initialize',
      token,
      constants.AddressZero, // use token owner
      MIN_VOTING_PERIOD,
      SNAPSHOT_WINDOW,
    );
  }

  // lpm

  if (useLPM) {
    log();

    if (await read('MetaheroLPMForUniswapV2', 'initialized')) {
      log('MetaheroLPMForUniswapV2 already initialized');
    } else {
      const ENABLE_BURN_LP_AT_VALUE = getEnvAsAmount(
        'lpm.ENABLE_BURN_LP_AT_VALUE',
        '10000000',
      );

      await execute(
        'MetaheroLPMForUniswapV2',
        {
          from,
          log: true,
        },
        'initialize',
        ENABLE_BURN_LP_AT_VALUE,
        busdToken,
        token,
        swapRouter,
      );
    }
  }

  log();

  // token

  if (await read('MetaheroToken', 'initialized')) {
    log('MetaheroToken  already initialized');
  } else {
    let lpm: string = constants.AddressZero;
    let uniswapPair: string;

    if (useLPM) {
      ({ address: lpm } = await get('MetaheroLPMForUniswapV2'));

      uniswapPair = await read('MetaheroLPMForUniswapV2', 'uniswapPair');
    }

    const ZERO_FEE = {
      sender: 0,
      recipient: 0,
    };

    const LP_FEE = {
      sender: 1,
      recipient: 1,
    };

    const TOTAL_SUPPLY = getEnvAsAmount('token.TOTAL_SUPPLY', '10000000000');
    const MIN_TOTAL_SUPPLY = getEnvAsAmount(
      'token.MIN_TOTAL_SUPPLY',
      '100000000',
    );

    await execute(
      'MetaheroToken',
      {
        from,
        log: true,
      },
      'initialize',
      ZERO_FEE,
      useLPM ? LP_FEE : ZERO_FEE,
      ZERO_FEE,
      MIN_TOTAL_SUPPLY,
      lpm,
      constants.AddressZero, // disable controller
      TOTAL_SUPPLY,
      useLPM
        ? [
            lpm, //
            uniswapPair,
          ]
        : [],
    );
  }
};

func.tags = ['initialize'];
func.dependencies = ['create'];

module.exports = func;
