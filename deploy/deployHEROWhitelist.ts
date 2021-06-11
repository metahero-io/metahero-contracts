import { DeployFunction } from 'hardhat-deploy/types';

const func: DeployFunction = async (hre) => {
  const {
    deployments: { deploy },
    getNamedAccounts,
  } = hre;
  const { from } = await getNamedAccounts();

  await deploy('HEROWhitelist', {
    from,
    log: true,
  });
};

func.id = 'deployHEROWhitelist';
func.tags = [
  'deploy', //
  'HEROWhitelist',
];

module.exports = func;
