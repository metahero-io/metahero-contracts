import 'hardhat/types/runtime';
import 'hardhat/types/config';
import type { Contract } from 'ethers';

declare module 'hardhat/types/runtime' {
  export interface HardhatRuntimeEnvironment {
    knownContracts?: {
      getAddress(contractName: string): string;
    };
    getNetworkEnv?<T>(envName: string, defaultValue: T): T;
    helpers: {
      getAccounts(): Promise<string[]>;
      deployContract?<T extends Contract = Contract>(
        contractName: string,
        ...contractArgs: any[]
      ): Promise<T>;
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
