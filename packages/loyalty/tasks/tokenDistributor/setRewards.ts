import { task, types } from 'hardhat/config';
import { TASK_NAME_PREFIX, parseAmount } from './common';

const TASK_NAME = `${TASK_NAME_PREFIX}:set-rewards`;

task(TASK_NAME, 'Sets MetaheroLoyaltyTokenDistributor rewards')
  .addOptionalParam('amount', 'Amount', '0', types.string)
  .setAction(
    async (
      args: {
        amount: string;
      },
      {
        deployments: { get, read, execute },
        helpers: { logNetwork, logTransaction, exitWithError, getAccounts },
      },
    ) => {
      logNetwork(false);

      const amount = parseAmount(args.amount);

      const [from] = await getAccounts();

      const { address: tokenDistributor } = await get(
        'MetaheroLoyaltyTokenDistributor',
      );

      const balance = await read(
        'MetaheroToken',
        'balanceOf',
        tokenDistributor,
      );

      try {
        if (balance.gt(0)) {
          console.log('Releasing rewards...');

          const { transactionHash } = await execute(
            'MetaheroLoyaltyTokenDistributor',
            {
              from,
            },
            'releaseRewards',
          );

          logTransaction(transactionHash);

          if (amount.gt(0)) {
            console.log();
          }
        }

        if (amount.gt(0)) {
          console.log('Transferring rewards...');

          const { transactionHash } = await execute(
            'MetaheroToken',
            {
              from,
            },
            'transfer',
            tokenDistributor,
            amount,
          );

          logTransaction(transactionHash);
        }
      } catch (err) {
        exitWithError('Transaction reverted');
      }
    },
  );
