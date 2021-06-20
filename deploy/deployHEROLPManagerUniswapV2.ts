import { DeployFunction } from 'hardhat-deploy/types';
import { ContractNames } from '../extensions';

const func: DeployFunction = async (hre) => {
  const {
    deployments: { deploy },
    getNamedAccounts,
  } = hre;
  const { from } = await getNamedAccounts();

  await deploy(ContractNames.HEROLPManagerUniswapV2, {
    from,
    log: true,
  });
};

func.tags = [
  'deploy', //
  ContractNames.HEROLPManagerUniswapV2,
];

module.exports = func;
