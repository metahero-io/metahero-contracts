import 'hardhat/types/runtime';
import 'hardhat/types/config';
import type { ContractNames } from './constants';

declare module 'hardhat/types/runtime' {
  export interface HardhatRuntimeEnvironment {
    knownContracts?: {
      getAddress(contractName: ContractNames): string;
    };
  }
}

declare module 'hardhat/types/config' {
  interface BuildPathsConfig {
    artifacts?: string;
    dist?: string;
  }

  export type KnownContractsAddresses = {
    [key: number]: {
      [key: string]: string;
    };
  };

  export interface HardhatUserConfig {
    buildPaths: BuildPathsConfig;
    knownContractsAddresses?: KnownContractsAddresses;
  }

  export interface HardhatConfig {
    buildPaths: BuildPathsConfig;
    knownContractsAddresses?: KnownContractsAddresses;
  }
}
