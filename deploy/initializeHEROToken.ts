import { DeployFunction } from 'hardhat-deploy/types';

const func: DeployFunction = async (hre) => {
  const {
    deployments: { get },
    getNamedAccounts,
  } = hre;
  const { from } = await getNamedAccounts();

  await get('HEROToken');
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
