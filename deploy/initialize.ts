import { BigNumber, constants } from 'ethers';
import { DeployFunction } from 'hardhat-deploy/types';
import { ContractNames } from '../extensions';

const func: DeployFunction = async (hre) => {
  const {
    deployments: { get, read, execute, log },
    getNamedAccounts,
    getNetworkEnv,
  } = hre;

  // settings

  // token

  const TOKEN_BURN_FEE = {
    sender: getNetworkEnv(
      'TOKEN_SENDER_BURN_FEE', //
      4,
    ),
    recipient: getNetworkEnv(
      'TOKEN_RECIPIENT_BURN_FEE', //
      4,
    ),
  };
  const TOKEN_LP_FEE = {
    sender: 0,
    recipient: 0,
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

  // dao

  const DAO_MIN_VOTING_PERIOD = getNetworkEnv(
    'DAO_MIN_VOTING_PERIOD',
    24 * 60 * 60, // 1 day
  );

  const DAO_SNAPSHOT_WINDOW = getNetworkEnv(
    'DAO_SNAPSHOT_WINDOW',
    24 * 60 * 60, // 1 day
  );

  const { from } = await getNamedAccounts();

  // token

  if (await read(ContractNames.MetaheroToken, 'initialized')) {
    log(`${ContractNames.MetaheroToken} already initialized`);
  } else {
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
      constants.AddressZero, // disable lpm
      constants.AddressZero, // disable controller
      TOKEN_TOTAL_SUPPLY,
      [],
    );
  }

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
      constants.AddressZero, // use token owner
      DAO_MIN_VOTING_PERIOD,
      DAO_SNAPSHOT_WINDOW,
    );
  }

  // wrapped token

  if (await read(ContractNames.MetaheroWrappedToken, 'initialized')) {
    log(`${ContractNames.MetaheroWrappedToken} already initialized`);
  } else {
    const { address: token } = await get(ContractNames.MetaheroToken);

    await execute(
      ContractNames.MetaheroWrappedToken,
      {
        from,
        log: true,
      },
      'initialize',
      token,
    );
  }
};

func.tags = ['initialize'];
func.dependencies = ['deploy'];

module.exports = func;
