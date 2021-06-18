import { BigNumber } from 'ethers';
import { DeployFunction } from 'hardhat-deploy/types';
import { ContractNames } from '../extensions';

const DEADLINE_IN = 0; // use default (14 days)
const TOKENS_AMOUNT_PER_NATIVE = 0; // use default (200000)
const MAX_PURCHASE_PRICE = 0; // use default (10.000000000000000000)
const ACCOUNTS: string[] = [
  //
];
const TOTAL_TOKENS = BigNumber.from('1000000000000000000000000000'); // 1,000,000,000.000000000000000000

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
      // for local node only
      ACCOUNTS.push(...signers.slice(1).map(({ address }) => address));
    }

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
      DEADLINE_IN,
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
