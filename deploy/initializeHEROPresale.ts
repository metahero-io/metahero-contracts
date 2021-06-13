import { BigNumber } from 'ethers';
import { DeployFunction } from 'hardhat-deploy/types';

const ACCOUNTS: string[] = [];
const UNIT_PRICE = BigNumber.from(1000);
const UNIT_TOKENS = BigNumber.from(100);

const func: DeployFunction = async (hre) => {
  const {
    deployments: { get, read, execute, log },
    getNamedAccounts,
    ethers: { getSigners },
  } = hre;
  const { from } = await getNamedAccounts();

  if (await read('HEROPresale', 'initialized')) {
    log('HEROPresale already initialized');
  } else {
    const { address: whitelist } = await get('HEROPresale');
    const { address: token } = await get('HEROToken');

    const signers = await getSigners();

    if (signers.length > 1) {
      ACCOUNTS.push(...signers.slice(1).map(({ address }) => address));

      const pendingTokens = UNIT_TOKENS.mul(ACCOUNTS.length);

      await execute(
        'HEROToken',
        {
          from,
          log: true,
        },
        'transfer',
        whitelist,
        pendingTokens,
      );
    }

    await execute(
      'HEROPresale',
      {
        from,
        log: true,
      },
      'initialize',
      token,
      0, // use default deadline in
      UNIT_PRICE,
      UNIT_TOKENS,
      ACCOUNTS,
    );
  }
};

func.id = 'initializeHEROPresale';
func.tags = [
  'initialize', //
  'HEROPresale',
];
func.dependencies = [
  'deploy', //
  'HEROToken',
];

module.exports = func;
