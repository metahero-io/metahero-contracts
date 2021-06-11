import { DeployFunction } from 'hardhat-deploy/types';

const func: DeployFunction = async (hre) => {
  const {
    deployments: { read, execute, log },
    getNamedAccounts,
  } = hre;
  const { from } = await getNamedAccounts();

  if (await read('HEROWhitelist', 'initialized')) {
    log('HEROWhitelist already initialized');
  } else {
    await execute(
      'HEROWhitelist',
      {
        from,
        log: true,
      },
      'initialize',
    );
  }
};

func.id = 'initializeHEROWhitelist';
func.tags = [
  'initialize', //
  'HEROWhitelist',
];
func.dependencies = [
  'deployHEROToken', //
  'deployHEROWhitelist',
];

module.exports = func;
