import { BigNumber } from 'ethers';
import { DeployFunction } from 'hardhat-deploy/types';
import { ContractNames } from '../extensions';

// settings
const UNIT_PRICE = BigNumber.from(1000);
const UNIT_TOKENS = BigNumber.from(100);
const DEADLINE_IN = 0; // use default

const ACCOUNTS: string[] = [];

const func: DeployFunction = async (hre) => {
  const {
    deployments: { get, read, execute, log },
    getNamedAccounts,
    ethers: { getSigners },
  } = hre;
  const { from } = await getNamedAccounts();

  if (await read(ContractNames.HEROPresale, 'initialized')) {
    log(`${ContractNames.HEROPresale} already initialized`);
  } else {
    const { address: whitelist } = await get(ContractNames.HEROPresale);
    const { address: token } = await get(ContractNames.HEROToken);

    const signers = await getSigners();

    if (signers.length > 1) {
      ACCOUNTS.push(...signers.slice(1).map(({ address }) => address));

      const pendingTokens = UNIT_TOKENS.mul(ACCOUNTS.length);

      await execute(
        ContractNames.HEROToken,
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
      ContractNames.HEROPresale,
      {
        from,
        log: true,
      },
      'initialize',
      token,
      DEADLINE_IN,
      UNIT_PRICE,
      UNIT_TOKENS,
      ACCOUNTS,
    );
  }
};

func.tags = [
  'initialize', //
  ContractNames.HEROPresale,
];
func.dependencies = [
  'deploy', //
  ContractNames.HEROToken,
];

module.exports = func;
