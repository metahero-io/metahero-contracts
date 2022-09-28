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

  // token

  await deploy('MetaheroLoyaltyToken', {
    from,
    log: true,
  });

  // distributor

  await deploy('MetaheroLoyaltyTokenDistributor', {
    from,
    log: true,
  });
};

func.tags = ['create'];

module.exports = func;
