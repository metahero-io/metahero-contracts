import 'hardhat/types/config';
import 'hardhat/types/runtime';
import type { Helpers } from './environment';
import type { Envs } from './common';

declare module 'hardhat/types/config' {
  export interface HardhatConfig {
    knownContracts?: Record<string, Record<string, string>>;
  }

  export interface HardhatUserConfig {
    knownContracts?: Record<string, Record<string, string>>;
  }
}

declare module 'hardhat/types/runtime' {
  export interface HardhatRuntimeEnvironment {
    helpers: Helpers;
    processEnvs: Envs;
    processNetworkEnvs: Envs;
    knownContracts: Record<string, string>;
  }
}
