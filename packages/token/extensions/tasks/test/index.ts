import { TASK_TEST } from 'hardhat/builtin-tasks/task-names';
import { task } from 'hardhat/config';

const { REPORT_GAS } = process.env;

task(TASK_TEST)
  .addFlag('reportGas', 'Report gas')
  .setAction(
    async (args: { global: boolean; reportGas?: boolean }, hre, runSuper) => {
      const { global, reportGas } = args;

      if (global) {
        return;
      }

      const { config } = hre;

      const {
        gasReporter,
      }: {
        gasReporter: {
          enabled: boolean;
        };
      } = config as any;

      if (gasReporter) {
        gasReporter.enabled = !!reportGas || REPORT_GAS === '1';
      }

      await runSuper(args);
    },
  );
