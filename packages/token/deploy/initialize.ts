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

  const [from] = await getAccounts();
  const { address: token } = await get('MetaheroToken');

  // dao

  if (await read('MetaheroDAO', 'initialized')) {
    log(`${'MetaheroDAO'} already initialized`);
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

  // TODO: lpm
  //
  // if (await read('MetaheroLPMForUniswapV2', 'initialized')) {
  //   log(`${'MetaheroLPMForUniswapV2'} already initialized`);
  // } else {
  //   await execute(
  //     'MetaheroLPMForUniswapV2',
  //     {
  //       from,
  //       log: true,
  //     },
  //     'initialize',
  //     token,
  //   );
  // }

  // token

  if (await read('MetaheroToken', 'initialized')) {
    log('MetaheroToken  already initialized');
  } else {
    const { address: lpm } = await get('MetaheroLPMForUniswapV2');

    const uniswapPair = await read('MetaheroLPMForUniswapV2', 'uniswapPair');

    const ZERO_FEE = {
      sender: 0,
      recipient: 0,
    };
    // const LP_FEE = {
    //   sender: 1,
    //   recipient: 1,
    // };

    const TOTAL_SUPPLY = getEnvAsAmount('token.TOTAL_SUPPLY', '9766213274');
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
      ZERO_FEE, // LP_FEE,
      ZERO_FEE,
      MIN_TOTAL_SUPPLY,
      constants.AddressZero, // disable lpm
      constants.AddressZero, // disable controller
      TOTAL_SUPPLY,
      [
        lpm, //
        uniswapPair,
      ],
    );
  }
};

func.tags = ['initialize'];
func.dependencies = ['deploy'];

module.exports = func;
