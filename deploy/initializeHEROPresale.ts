import { BigNumber } from 'ethers';
import { DeployFunction } from 'hardhat-deploy/types';
import { ContractNames } from '../extensions';

const func: DeployFunction = async (hre) => {
  const {
    deployments: { get, read, execute, log },
    getNamedAccounts,
    ethers: { getSigners },
    getNetworkEnv,
  } = hre;

  // settings

  const DEADLINE_IN = getNetworkEnv(
    'PRESALE_DEADLINE_IN',
    14, //14 days
  );
  const TOKENS_AMOUNT_PER_NATIVE = getNetworkEnv(
    'PRESALE_TOKENS_AMOUNT_PER_NATIVE',
    BigNumber.from('200000'), // 200000
  );
  const MAX_PURCHASE_PRICE = getNetworkEnv(
    'PRESALE_MAX_PURCHASE_PRICE',
    BigNumber.from('10000000000000000000'), // 10.000000000000000000
  );
  const ACCOUNTS: string[] = [];
  const TOTAL_TOKENS = getNetworkEnv(
    'PRESALE_TOTAL_TOKENS',
    BigNumber.from('1000000000000000000000000000'), // 1,000,000,000.000000000000000000
  );

  const { from } = await getNamedAccounts();

  if (await read(ContractNames.HEROPresale, 'initialized')) {
    log(`${ContractNames.HEROPresale} already initialized`);
  } else {
    const { address: whitelist } = await get(ContractNames.HEROPresale);
    const { address: token } = await get(ContractNames.HEROToken);

    const signers = await getSigners();

    if (signers.length > 1) {
      // for local node only
      ACCOUNTS.push(...signers.slice(1).map(({ address }) => address));
    }

    await execute(
      ContractNames.HEROToken,
      {
        from,
        log: true,
      },
      'excludeAccount',
      whitelist,
      true,
    );

    if (TOTAL_TOKENS.gt(0)) {
      await execute(
        ContractNames.HEROToken,
        {
          from,
          log: true,
        },
        'transfer',
        whitelist,
        TOTAL_TOKENS,
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
      TOKENS_AMOUNT_PER_NATIVE,
      MAX_PURCHASE_PRICE,
      DEADLINE_IN * 24 * 60 * 60,
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
