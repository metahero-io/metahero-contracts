import { extendEnvironment } from 'hardhat/config';
import { Deployment } from 'hardhat-deploy/types';
import { Envs } from '../common';
import { Helpers } from './classes';

extendEnvironment((hre) => {
  const {
    network: { name: networkName },
    config: { knownContracts },
    deployments,
  } = hre;
  const { processEnvs } = Envs;

  hre.helpers = new Helpers(hre);

  hre.processEnvs = processEnvs;
  hre.processNetworkEnvs = processEnvs.useNamespace(networkName);

  hre.knownContracts = knownContracts[networkName] || {};

  const { get } = deployments;

  deployments.get = async (name) => {
    let result: Deployment;

    const address = hre.knownContracts[name];

    if (address) {
      result = {
        address,
        abi: null,
      };
    } else {
      result = await get(name);
    }

    return result;
  };
});
