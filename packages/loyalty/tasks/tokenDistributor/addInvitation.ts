import { task, types } from 'hardhat/config';
import { TASK_NAME_PREFIX, parseAmount, parsePercentage } from './common';

const TASK_NAME = `${TASK_NAME_PREFIX}:add-invitation`;

const DEPOSIT_MAX_POWER = 100;

task(TASK_NAME, 'Adds invitation to MetaheroLoyaltyTokenDistributor contract')
  .addParam('invitationId', 'Invitation Id', undefined, types.int)
  .addParam('treeRoot', 'Tree root', undefined, types.string)
  .addParam('depositPower', 'Deposit power', undefined, types.int)
  .addParam('minDeposit', 'Min. deposit', undefined, types.string)
  .addParam('maxDeposit', 'Max. deposit', undefined, types.string)
  .addParam('minRewardsApy', 'Min. rewards APY', undefined, types.float)
  .addParam('maxRewardsApy', 'Max. rewards APY', undefined, types.float)
  .addParam(
    'minWithdrawalLockTime',
    'Min. withdrawal lock time',
    null,
    types.int,
  )
  .addParam(
    'maxWithdrawalLockTime',
    'Max. withdrawal lock time',
    null,
    types.int,
  )
  .setAction(
    async (
      args: {
        invitationId: number;
        treeRoot: string;
        depositPower: number;
        minDeposit: string;
        maxDeposit: string;
        minRewardsApy: number;
        maxRewardsApy: number;
        minWithdrawalLockTime: number;
        maxWithdrawalLockTime: number;
      },
      {
        deployments: { read, execute },
        helpers: { getAccounts, logNetwork, logTransaction, exitWithError },
        ethers: { utils },
      },
    ) => {
      logNetwork(false);

      const {
        invitationId,
        treeRoot,
        depositPower,
        minWithdrawalLockTime,
        maxWithdrawalLockTime,
      } = args;

      const minDeposit = parseAmount(args.minDeposit);
      const maxDeposit = parseAmount(args.maxDeposit);
      const minRewardsAPY = parsePercentage(args.minRewardsApy);
      const maxRewardsAPY = parsePercentage(args.maxRewardsApy);

      if (!utils.isHexString(treeRoot, 32)) {
        exitWithError('Invalid tree root');
      }

      if (maxDeposit.eq(0)) {
        exitWithError('Invalid max. deposit');
      }

      if (depositPower === 0 || depositPower > DEPOSIT_MAX_POWER) {
        exitWithError('Invalid deposit power');
      }

      if (minDeposit.eq(0) || minDeposit.gt(maxDeposit)) {
        exitWithError('Invalid min. deposit');
      }

      if (maxDeposit.eq(0)) {
        exitWithError('Invalid max. deposit');
      }

      if (minRewardsAPY === 0) {
        if (maxRewardsAPY) {
          exitWithError('Invalid max. rewards APY');
        }
        if (minWithdrawalLockTime !== maxWithdrawalLockTime) {
          exitWithError('Invalid max. withdrawal lock time');
        }
      } else {
        if (maxRewardsAPY < minRewardsAPY) {
          exitWithError('Invalid max. rewards APY');
        }

        if (minWithdrawalLockTime === 0) {
          exitWithError('Invalid min. withdrawal lock time');
        }

        if (maxWithdrawalLockTime < minWithdrawalLockTime) {
          exitWithError('Invalid max. withdrawal lock time');
        }
      }

      const [from] = await getAccounts();

      const invitation = await read(
        'MetaheroLoyaltyTokenDistributor',
        'getInvitation',
        invitationId,
      );

      if (invitation.state !== 0) {
        exitWithError('Invitation already exists');
      }

      try {
        console.log('Adding invitation...');

        const { transactionHash } = await execute(
          'MetaheroLoyaltyTokenDistributor',
          {
            from,
          },
          'addInvitation',
          invitationId,
          treeRoot,
          depositPower,
          minDeposit,
          maxDeposit,
          minRewardsAPY,
          maxRewardsAPY,
          minWithdrawalLockTime,
          maxWithdrawalLockTime,
        );

        logTransaction(transactionHash);
      } catch (err) {
        exitWithError('Transaction reverted');
      }
    },
  );
