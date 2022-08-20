import { task, types } from 'hardhat/config';
import { MetaheroLoyaltyTokenDistributor } from '../../typechain';
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

      const { invitationId } = args;

      const [signer] = await getSigners();

      const tokenDistributor =
        await getDeployedContract<MetaheroLoyaltyTokenDistributor>(
          'MetaheroLoyaltyTokenDistributor',
          signer,
        );

      const invitation = await tokenDistributor.getInvitation(invitationId);

      if (invitation.state !== 1) {
        exitWithError("Invitation doesn't exist");
      }

      try {
        console.log('Removing invitation...');

        const { hash, wait } = await tokenDistributor.removeInvitation(
          invitationId,
        );

        await wait();

        logTransaction(hash);
      } catch (err) {
        exitWithError('Transaction reverted');
      }
    },
  );
