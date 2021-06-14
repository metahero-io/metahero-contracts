import { DeployFunction } from 'hardhat-deploy/types';
import { ContractNames } from '../extensions';

const func: DeployFunction = async (hre) => {
  const {
    deployments: { deploy },
    getNamedAccounts,
  } = hre;
  const { from } = await getNamedAccounts();

  await deploy(ContractNames.HEROPresale, {
    from,
    log: true,
  });
};

func.tags = [
  'deploy', //
  ContractNames.HEROPresale,
];

module.exports = func;
