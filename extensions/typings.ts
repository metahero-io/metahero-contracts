import 'hardhat/types/config';
import 'hardhat/types/runtime';

declare module 'hardhat/types/config' {
  interface BuildPathsConfig {
    artifacts?: string;
    dist?: string;
  }

  export interface HardhatUserConfig {
    buildPaths: BuildPathsConfig;
  }

  export interface HardhatConfig {
    buildPaths: BuildPathsConfig;
  }
}
