import { BigNumber } from 'ethers';
import { DeployFunction } from 'hardhat-deploy/types';
import { ContractNames } from '../extensions';

const func: DeployFunction = async (hre) => {
  const {
    deployments: { get, read, execute, log },
    getNamedAccounts,
    knownContracts,
    getNetworkEnv,
  } = hre;

  // settings

  const LP_FEE = {
    sender: getNetworkEnv('TOKEN_SENDER_LP_FEE', 4),
    recipient: getNetworkEnv('TOKEN_RECIPIENT_LP_FEE', 4),
  };
  const REWARDS_FEE = {
    sender: getNetworkEnv('TOKEN_SENDER_REWARDS_FEE', 1),
    recipient: getNetworkEnv('TOKEN_RECIPIENT_REWARDS_FEE', 1),
  };
  const ENABLE_BURN_LP_AT_VALUE = getNetworkEnv(
    'TOKEN_ENABLE_BURN_LP_AT_VALUE',
    BigNumber.from(0), // use default (10,000,000.000000000000000000)
  );
  const TOTAL_SUPPLY = getNetworkEnv(
    'TOKEN_TOTAL_SUPPLY',
    BigNumber.from(0), // use default (10,000,000,000.000000000000000000)
  );
  const EXECUTE_ACCOUNTS: string[] = [
    //
  ];

  const { from } = await getNamedAccounts();

  if (await read(ContractNames.HEROToken, 'initialized')) {
    log(`${ContractNames.HEROToken} already initialized`);
  } else {
    const { address: whitelist } = await get(ContractNames.HEROPresale);

    await execute(
      ContractNames.HEROToken,
      {
        from,
        log: true,
      },
      'initialize',
      LP_FEE,
      REWARDS_FEE,
      TOTAL_SUPPLY,
      EXECUTE_ACCOUNTS,
      ENABLE_BURN_LP_AT_VALUE,
      knownContracts.getAddress(ContractNames.SwapRouter),
      knownContracts.getAddress(ContractNames.BUSDToken),
    );

    await execute(
      ContractNames.HEROToken,
      {
        from,
        log: true,
      },
      'excludeAccount',
      whitelist,
      true,
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
