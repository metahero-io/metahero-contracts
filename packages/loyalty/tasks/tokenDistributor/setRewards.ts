import { task, types } from 'hardhat/config';
import { TASK_NAME_PREFIX, parseAmount } from './common';
import { MetaheroLoyaltyTokenDistributor, ERC20 } from '../../typechain';

const TASK_NAME = `${TASK_NAME_PREFIX}:set-rewards`;

task(TASK_NAME, 'Sets MetaheroLoyaltyTokenDistributor rewards')
  .addOptionalParam('amount', 'Amount', '0', types.string)
  .setAction(
    async (
      args: {
        amount: string;
      },
      {
        helpers: {
          getSigners,
          getDeployedContract,
          logNetwork,
          logTransaction,
          exitWithError,
        },
      },
    ) => {
      logNetwork(false);

      const amount = parseAmount(args.amount);

      const [signer] = await getSigners();

      const token = await getDeployedContract<ERC20>('MetaheroToken', signer);

      const tokenDistributor =
        await getDeployedContract<MetaheroLoyaltyTokenDistributor>(
          'MetaheroLoyaltyTokenDistributor',
          signer,
        );

      const balance = await token.balanceOf(tokenDistributor.address);

      try {
        if (balance.gt(0)) {
          console.log('Releasing rewards...');

          const { hash, wait } = await tokenDistributor.releaseRewards();

          await wait();

          logTransaction(hash);

          console.log();
        }

        if (amount.gt(0)) {
          console.log('Transferring rewards...');

          const { hash, wait } = await token.transfer(
            tokenDistributor.address,
            amount,
          );

          await wait();

          logTransaction(hash);
        }
      } catch (err) {
        exitWithError('Transaction reverted');
      }
    },
  );
