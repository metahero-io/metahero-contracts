import 'hardhat/types/config';
import 'hardhat/types/runtime';
import type { Helpers } from './environment';
import type { Envs } from './shared';

declare module 'hardhat/types/config' {
  //
}

declare module 'hardhat/types/runtime' {
  export interface HardhatRuntimeEnvironment {
    helpers: Helpers;
    processEnvs: Envs;
    processNetworkEnvs: Envs;
  }
}
