import { BigNumber } from 'ethers';
import { DeployFunction } from 'hardhat-deploy/types';

const ACCOUNTS: string[] = [];
const CLAIM_UNIT_PRICE = BigNumber.from(1000);
const CLAIM_UNIT_TOKENS = BigNumber.from(100);

const func: DeployFunction = async (hre) => {
  const {
    deployments: { get, read, execute, log },
    getNamedAccounts,
    ethers: { getSigners },
  } = hre;
  const { from } = await getNamedAccounts();

  if (await read('HEROWhitelist', 'initialized')) {
    log('HEROWhitelist already initialized');
  } else {
    const { address: whitelist } = await get('HEROWhitelist');
    const { address: token } = await get('HEROToken');

    const signers = await getSigners();

    ACCOUNTS.push(...signers.slice(1).map(({ address }) => address));

    const unclaimedTokens = CLAIM_UNIT_TOKENS.mul(ACCOUNTS.length);

    await execute(
      'HEROToken',
      {
        from,
        log: true,
      },
      'transfer',
      whitelist,
      unclaimedTokens,
    );

    await execute(
      'HEROWhitelist',
      {
        from,
        log: true,
      },
      'initialize',
      token,
      0, // use default deadline in
      CLAIM_UNIT_PRICE,
      CLAIM_UNIT_TOKENS,
      ACCOUNTS,
    );
  }
};

func.id = 'initializeHEROWhitelist';
func.tags = [
  'initialize', //
  'HEROWhitelist',
];
func.dependencies = [
  'deployHEROToken', //
  'deployHEROWhitelist',
];

module.exports = func;
