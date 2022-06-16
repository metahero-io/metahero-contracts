import { DeployFunction } from 'hardhat-deploy/types';

const func: DeployFunction = async (hre) => {
  const {
    deployments: { deploy },
    helpers: { getAccounts },
  } = hre;

  const [from] = await getAccounts();

  // dao

  await deploy('MetaheroDAO', {
    from,
    log: true,
  });

  // lpm

  await deploy('MetaheroLPMForUniswapV2', {
    from,
    log: true,
  });

  // token

  await deploy('MetaheroToken', {
    from,
    log: true,
  });
};

func.tags = ['deploy'];

module.exports = func;
