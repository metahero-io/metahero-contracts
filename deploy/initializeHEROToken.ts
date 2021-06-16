import { DeployFunction } from 'hardhat-deploy/types';
import { ContractNames } from '../extensions';

const LP_FEE = {
  sender: 4,
  recipient: 4,
};
const REWARDS_FEE = {
  sender: 1,
  recipient: 1,
};
const TOTAL_SUPPLY = 0; // use default (10,000,000,000.000000000)
const EXECUTE_ACCOUNTS: string[] = [
  //
];

const func: DeployFunction = async (hre) => {
  const {
    deployments: { get, read, execute, log },
    getNamedAccounts,
    knownContracts,
  } = hre;
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
