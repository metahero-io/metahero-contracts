import { extendEnvironment } from 'hardhat/config';
import { Envs } from '../shared';
import { Helpers } from './classes';

extendEnvironment((hre) => {
  const {
    network: { name: networkName },
  } = hre;
  const { processEnvs } = Envs;

  hre.helpers = new Helpers(hre);

  hre.processEnvs = processEnvs;
  hre.processNetworkEnvs = processEnvs.useNamespace(networkName);
});
