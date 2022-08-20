import { task, types } from 'hardhat/config';
import { TASK_NAME_PREFIX } from './common';

const TASK_NAME = `${TASK_NAME_PREFIX}:remove-invitation`;

task(
  TASK_NAME,
  'Removes invitation from MetaheroLoyaltyTokenDistributor contract',
)
  .addParam('invitationId', 'Invitation Id', undefined, types.int)
  .setAction(
    async (
      args: {
        invitationId: number;
      },
      {
        deployments: { read, execute },
        helpers: { getAccounts, logNetwork, logTransaction, exitWithError },
      },
    ) => {
      logNetwork(false);

      const { invitationId } = args;

      const [from] = await getAccounts();

      const invitation = await read(
        'MetaheroLoyaltyTokenDistributor',
        'getInvitation',
        invitationId,
      );

      if (invitation.state !== 1) {
        exitWithError("Invitation doesn't exist");
      }

      try {
        console.log('Removing invitation...');

        const { transactionHash } = await execute(
          'MetaheroLoyaltyTokenDistributor',
          {
            from,
          },
          'removeInvitation',
          invitationId,
        );

        logTransaction(transactionHash);
      } catch (err) {
        exitWithError('Transaction reverted');
      }
    },
  );
