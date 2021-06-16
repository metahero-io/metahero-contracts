import { DeployFunction } from 'hardhat-deploy/types';
import { ContractNames } from '../extensions';

// settings
const LP_FEE = {
  sender: 4,
  recipient: 4,
};
const REWARDS_FEE = {
  sender: 1,
  recipient: 1,
};
const TOTAL_SUPPLY = 0; // use default

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

    const excluded: string[] = [
      whitelist, //
    ];

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
      excluded,
      knownContracts.getAddress(ContractNames.SwapRouter),
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
