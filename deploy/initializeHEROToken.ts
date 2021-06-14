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

const func: DeployFunction = async (hre) => {
  const {
    deployments: { get, read, execute, log },
    getNamedAccounts,
    knownContracts,
  } = hre;
  const { from } = await getNamedAccounts();

  if (await read('HEROToken', 'initialized')) {
    log('HEROToken already initialized');
  } else {
    const { address: whitelist } = await get('HEROPresale');

    const excluded: string[] = [
      whitelist, //
    ];

    await execute(
      'HEROToken',
      {
        from,
        log: true,
      },
      'initialize',
      LP_FEE,
      REWARDS_FEE,
      0, // use default totalSupply
      excluded,
      knownContracts.getAddress(ContractNames.SwapRouter),
    );
  }
};

func.id = 'initializeHEROToken';
func.tags = [
  'initialize', //
  'HEROToken',
];
func.dependencies = [
  'deploy', //
];

module.exports = func;
