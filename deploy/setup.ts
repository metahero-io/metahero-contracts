import { DeployFunction } from 'hardhat-deploy/types';
import { NetworkNames } from '../extensions';

const func: DeployFunction = async (hre) => {
  const {
    network: { name },
  } = hre;

  if (name === NetworkNames.Bsc) {
    return;
  }
};

func.tags = ['setup'];
func.dependencies = ['initialize'];

module.exports = func;
