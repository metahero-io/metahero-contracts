import { DeployFunction } from 'hardhat-deploy/types';

const func: DeployFunction = async (hre) => {
  const {
    deployments: { deploy, log },
    helpers: { getAccounts },
  } = hre;

  log();
  log('# create');
  log();

  const [from] = await getAccounts();

  // erc20 helper

  await deploy('ERC20Helper', {
    from,
    log: true,
  });
};

func.tags = ['create'];

module.exports = func;
