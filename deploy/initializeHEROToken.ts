import { DeployFunction } from 'hardhat-deploy/types';

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
  } = hre;
  const { from } = await getNamedAccounts();

  if (await read('HEROToken', 'initialized')) {
    log('HEROToken already initialized');
  } else {
    const excluded: string[] = [];

    {
      const { address } = await get('HEROWhitelist');
      excluded.push(address);
    }

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
    );
  }
};

func.id = 'initializeHEROToken';
func.tags = [
  'initialize', //
  'HEROToken',
];
func.dependencies = [
  'deployHEROToken', //
  'deployHEROWhitelist',
];

module.exports = func;
