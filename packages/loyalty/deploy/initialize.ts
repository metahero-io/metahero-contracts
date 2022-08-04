import { DeployFunction } from 'hardhat-deploy/types';

const func: DeployFunction = async (hre) => {
  const {
    deployments: { get, read, execute, log },
    helpers: { getAccounts },
    processNetworkEnvs: { getEnvAsNumber },
  } = hre;

  log();
  log('# initialize');
  log();

  const [from] = await getAccounts();

  const { address: paymentToken } = await get('MetaheroToken');
  const { address: token } = await get('MetaheroLoyaltyToken');
  const { address: auction } = await get('MetaheroLoyaltyTokenAuction');
  const { address: distributor } = await get('MetaheroLoyaltyTokenDistributor');

  // token

  if (await read('MetaheroLoyaltyToken', 'initialized')) {
    log('MetaheroLoyaltyToken already initialized');
  } else {
    const SNAPSHOT_WINDOW_MIN_LENGTH = getEnvAsNumber(
      'SNAPSHOT_WINDOW_MIN_LENGTH',
      7 * 24 * 60 * 60, // 7 days
    );

    const EARLY_WITHDRAWAL_TAX = getEnvAsNumber(
      'EARLY_WITHDRAWAL_TAX',
      5_000, // 5 %
    );

    await execute(
      'MetaheroLoyaltyToken',
      {
        from,
        log: true,
      },
      'initialize',
      paymentToken,
      auction,
      distributor,
      SNAPSHOT_WINDOW_MIN_LENGTH,
      EARLY_WITHDRAWAL_TAX,
    );
  }

  // auction

  if (await read('MetaheroLoyaltyTokenAuction', 'initialized')) {
    log('MetaheroLoyaltyTokenAuction already initialized');
  } else {
    const AUCTION_TIME = getEnvAsNumber(
      'AUCTION_TIME',
      2 * 24 * 60 * 60, // 2 days
    );

    const UNLOCK_WITHDRAWAL_MAX_TIME = getEnvAsNumber(
      'UNLOCK_WITHDRAWAL_MAX_TIME',
      365 * 24 * 60 * 60, // 365 days
    );

    await execute(
      'MetaheroLoyaltyTokenAuction',
      {
        from,
        log: true,
      },
      'initialize',
      token,
      paymentToken,
      AUCTION_TIME,
      UNLOCK_WITHDRAWAL_MAX_TIME,
      [],
      [],
    );
  }

  // distributor

  if (await read('MetaheroLoyaltyTokenDistributor', 'initialized')) {
    log('MetaheroLoyaltyTokenDistributor already initialized');
  } else {
    await execute(
      'MetaheroLoyaltyTokenDistributor',
      {
        from,
        log: true,
      },
      'initialize',
      token,
      paymentToken,
    );
  }
};

func.tags = ['initialize'];
func.dependencies = ['create'];

module.exports = func;
