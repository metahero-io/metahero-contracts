import { BigNumber, constants } from 'ethers';
import { DeployFunction } from 'hardhat-deploy/types';
import { ContractNames } from '../extensions';

const func: DeployFunction = async (hre) => {
  const {
    deployments: { get, read, execute, log },
    getNamedAccounts,
    getNetworkEnv,
    knownContracts,
  } = hre;

  // settings

  // dao

  const DAO_SNAPSHOT_WINDOW = getNetworkEnv(
    'DAO_SNAPSHOT_WINDOW',
    24 * 60 * 60, // 1 day
  );

  // lpm

  const LPM_ENABLE_BURN_LP_AT_VALUE = getNetworkEnv(
    'LPM_FOR_UNISWAP_V2_ENABLE_BURN_LP_AT_VALUE',
    BigNumber.from('10000000000000000000000000'), // 10,000,000.000000000000000000
  );

  // token

  const TOKEN_BURN_FEE = {
    sender: getNetworkEnv(
      'TOKEN_SENDER_BURN_FEE', //
      1,
    ),
    recipient: getNetworkEnv(
      'TOKEN_RECIPIENT_BURN_FEE', //
      1,
    ),
  };
  const TOKEN_LP_FEE = {
    sender: getNetworkEnv(
      'TOKEN_SENDER_LP_FEE', //
      3,
    ),
    recipient: getNetworkEnv(
      'TOKEN_RECIPIENT_LP_FEE', //
      3,
    ),
  };
  const TOKEN_REWARDS_FEE = {
    sender: getNetworkEnv(
      'TOKEN_SENDER_REWARDS_FEE', //
      1,
    ),
    recipient: getNetworkEnv(
      'TOKEN_RECIPIENT_REWARDS_FEE', //
      1,
    ),
  };
  const TOKEN_TOTAL_SUPPLY = getNetworkEnv(
    'TOKEN_TOTAL_SUPPLY',
    BigNumber.from('10000000000000000000000000000'), // 10,000,000,000.000000000000000000
  );
  const TOKEN_MIN_TOTAL_SUPPLY = getNetworkEnv(
    'TOKEN_MIN_TOTAL_SUPPLY',
    BigNumber.from('100000000000000000000000000'), // 100,000,000.000000000000000000
  );

  const { from } = await getNamedAccounts();

  // dao

  if (await read(ContractNames.MetaheroDAO, 'initialized')) {
    log(`${ContractNames.MetaheroDAO} already initialized`);
  } else {
    const { address: token } = await get(ContractNames.MetaheroToken);

    await execute(
      ContractNames.MetaheroDAO,
      {
        from,
        log: true,
      },
      'initialize',
      token,
      DAO_SNAPSHOT_WINDOW,
    );
  }

  // lpm

  if (await read(ContractNames.MetaheroLPMForUniswapV2, 'initialized')) {
    log(`${ContractNames.MetaheroLPMForUniswapV2} already initialized`);
  } else {
    const { address: token } = await get(ContractNames.MetaheroToken);

    await execute(
      ContractNames.MetaheroLPMForUniswapV2,
      {
        from,
        log: true,
      },
      'initialize',
      LPM_ENABLE_BURN_LP_AT_VALUE,
      knownContracts.getAddress(ContractNames.StableCoin),
      token,
      knownContracts.getAddress(ContractNames.UniswapV2Router),
    );
  }

  // token

  if (await read(ContractNames.MetaheroToken, 'initialized')) {
    log(`${ContractNames.MetaheroToken} already initialized`);
  } else {
    const { address: lpm } = await get(ContractNames.MetaheroLPMForUniswapV2);

    const uniswapPair = await read(
      ContractNames.MetaheroLPMForUniswapV2,
      'uniswapPair',
    );

    await execute(
      ContractNames.MetaheroToken,
      {
        from,
        log: true,
      },
      'initialize',
      TOKEN_BURN_FEE,
      TOKEN_LP_FEE,
      TOKEN_REWARDS_FEE,
      TOKEN_MIN_TOTAL_SUPPLY,
      lpm,
      constants.AddressZero, // disable controller
      TOKEN_TOTAL_SUPPLY,
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
