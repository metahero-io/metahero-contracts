import { DeployFunction } from 'hardhat-deploy/types';

const func: DeployFunction = async (hre) => {
  const {
    deployments: { log },
    helpers: { getKnownAddress },
  } = hre;

  log();
  log('# frontend envs');
  log();
  log(
    `REACT_APP_LOYALTY_TOKEN_ADDRESS=${await getKnownAddress(
      'MetaheroLoyaltyToken',
    )}`,
  );
  log(
    `REACT_APP_LOYALTY_TOKEN_AUCTION_ADDRESS=${await getKnownAddress(
      'MetaheroLoyaltyTokenAuction',
    )}`,
  );
  log(
    `REACT_APP_LOYALTY_TOKEN_DISTRIBUTOR_ADDRESS=${await getKnownAddress(
      'MetaheroLoyaltyTokenDistributor',
    )}`,
  );
};

func.tags = ['print'];
func.dependencies = ['initialize'];

module.exports = func;
