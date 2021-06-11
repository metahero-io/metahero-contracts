import { DeployFunction } from 'hardhat-deploy/types';

const func: DeployFunction = async (hre) => {
  const {
    deployments: { deploy },
    getNamedAccounts,
  } = hre;
  const { from } = await getNamedAccounts();

  await deploy('HEROToken', {
    from,
    log: true,
  });
};

func.id = 'deployHEROToken';
func.tags = [
  'deploy', //
  'HEROToken',
];

module.exports = func;
