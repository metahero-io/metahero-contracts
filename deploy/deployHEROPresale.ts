import { DeployFunction } from 'hardhat-deploy/types';

const func: DeployFunction = async (hre) => {
  const {
    deployments: { deploy },
    getNamedAccounts,
  } = hre;
  const { from } = await getNamedAccounts();

  await deploy('HEROPresale', {
    from,
    log: true,
  });
};

func.id = 'deployHEROPresale';
func.tags = [
  'deploy', //
  'HEROPresale',
];

module.exports = func;
