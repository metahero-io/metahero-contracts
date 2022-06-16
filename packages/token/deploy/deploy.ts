import { DeployFunction } from 'hardhat-deploy/types';

const func: DeployFunction = async (hre) => {
  const {
    deployments: { deploy, log },
    helpers: { getAccounts },
  } = hre;

  const [from] = await getAccounts();

  log();

  // dao

  await deploy('MetaheroDAO', {
    from,
    log: true,
  });

  log();

  // lpm

  await deploy('MetaheroLPMForUniswapV2', {
    from,
    log: true,
  });

  log();

  // token

  await deploy('MetaheroToken', {
    from,
    log: true,
  });
};

func.tags = ['deploy'];

module.exports = func;
