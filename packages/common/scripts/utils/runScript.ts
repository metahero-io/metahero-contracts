import hre from 'hardhat';
import { HardhatRuntimeEnvironment } from 'hardhat/types';

/* eslint-disable no-process-exit */

export function runScript(
  main: (hre: HardhatRuntimeEnvironment) => Promise<any>,
): void {
  const wrapper = async () => {
    await main(hre);
  };

  wrapper()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
