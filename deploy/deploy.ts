import { DeployFunction } from 'hardhat-deploy/types';
import { ContractNames } from '../extensions';

const func: DeployFunction = async (hre) => {
  const {
    deployments: { deploy },
    getNamedAccounts,
  } = hre;
  const { from } = await getNamedAccounts();

  await deploy(ContractNames.MetaheroDAO, {
    from,
    log: true,
  });

  await deploy(ContractNames.MetaheroToken, {
    from,
    log: true,
  });

  await deploy(ContractNames.MetaheroSwapHelper, {
    from,
    log: true,
  });

  // TODO: enable wrapped token
  // await deploy(ContractNames.MetaheroWrappedToken, {
  //   from,
  //   log: true,
  // });
};

func.tags = ['deploy'];

module.exports = func;
