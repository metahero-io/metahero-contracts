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

  const BURN_FEE = {
    sender: getNetworkEnv(
      'TOKEN_SENDER_BURN_FEE', //
      1,
    ),
    recipient: getNetworkEnv(
      'TOKEN_RECIPIENT_BURN_FEE', //
      1,
    ),
  };
  const LP_FEE = {
    sender: getNetworkEnv(
      'TOKEN_SENDER_LP_FEE', //
      3,
    ),
    recipient: getNetworkEnv(
      'TOKEN_RECIPIENT_LP_FEE', //
      3,
    ),
  };
  const REWARDS_FEE = {
    sender: getNetworkEnv(
      'TOKEN_SENDER_REWARDS_FEE', //
      1,
    ),
    recipient: getNetworkEnv(
      'TOKEN_RECIPIENT_REWARDS_FEE', //
      1,
    ),
  };
  const TOTAL_SUPPLY = getNetworkEnv(
    'TOKEN_TOTAL_SUPPLY',
    BigNumber.from('10000000000000000000000000000'), // 10,000,000,000.000000000000000000
  );
  const EXECUTE_ACCOUNTS: string[] = [];

  const { from } = await getNamedAccounts();

  if (await read(ContractNames.HEROToken, 'initialized')) {
    log(`${ContractNames.HEROToken} already initialized`);
  } else {
    const { address: lpManager } = await get(
      ContractNames.HEROLPManagerUniswapV2,
    );

    await execute(
      ContractNames.HEROToken,
      {
        from,
        log: true,
      },
      'initialize',
      BURN_FEE,
      LP_FEE,
      REWARDS_FEE,
      lpManager,
      constants.AddressZero, // disable controller
      TOTAL_SUPPLY,
      EXECUTE_ACCOUNTS,
    );
  }
};

func.tags = [
  'initialize', //
  ContractNames.HEROToken,
];
func.dependencies = [
  'deploy', //
];

module.exports = func;
