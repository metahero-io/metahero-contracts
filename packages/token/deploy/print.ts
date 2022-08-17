import { DeployFunction } from 'hardhat-deploy/types';

const func: DeployFunction = async (hre) => {
  const {
    deployments: { log },
    helpers: { getKnownAddress },
  } = hre;

  log();
  log('# frontend envs');
  log();
  log(
    `REACT_APP_PAYMENT_TOKEN_ADDRESS=${await getKnownAddress('MetaheroToken')}`,
  );
  log(`REACT_APP_SWAP_ROUTER_ADDRESS=${await getKnownAddress('SwapRouter')}`);
  log(`REACT_APP_BUSD_ADDRESS=${await getKnownAddress('SwapStableCoin')}`);
  log(`REACT_APP_WBNB_ADDRESS=${await getKnownAddress('SwapWrappedNative')}`);
};

func.tags = ['print'];
func.dependencies = ['setup'];

module.exports = func;
