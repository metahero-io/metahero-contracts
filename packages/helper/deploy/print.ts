import { DeployFunction } from 'hardhat-deploy/types';

const func: DeployFunction = async (hre) => {
  const {
    deployments: { log },
    helpers: { getKnownAddress },
  } = hre;

  log();
  log('# frontend envs');
  log();
  log(`REACT_APP_ERC20_HELPER_ADDRESS=${await getKnownAddress('ERC20Helper')}`);
};

func.tags = ['print'];
func.dependencies = ['create'];

module.exports = func;
