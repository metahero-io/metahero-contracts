import { BigNumber, constants } from 'ethers';
import { DeployFunction } from 'hardhat-deploy/types';
import { ContractNames } from '../extensions';

const func: DeployFunction = async (hre) => {
  const {
    deployments: { get, read, execute, log },
    getNamedAccounts,
    ethers: { getSigners },
    getNetworkEnv,
    knownContracts,
  } = hre;

  // settings

  // lpm

  const LPM_ENABLE_BURN_LP_AT_VALUE = getNetworkEnv(
    'LPM_FOR_UNISWAP_V2_ENABLE_BURN_LP_AT_VALUE',
    BigNumber.from('10000000000000000000000000'), // 10,000,000.000000000000000000
  );

  // token

  const TOKEN_BURN_FEE = {
    sender: getNetworkEnv(
      'TOKEN_SENDER_BURN_FEE', //
      1,
    ),
    recipient: getNetworkEnv(
      'TOKEN_RECIPIENT_BURN_FEE', //
      1,
    ),
  };
  const TOKEN_LP_FEE = {
    sender: getNetworkEnv(
      'TOKEN_SENDER_LP_FEE', //
      3,
    ),
    recipient: getNetworkEnv(
      'TOKEN_RECIPIENT_LP_FEE', //
      3,
    ),
  };
  const TOKEN_REWARDS_FEE = {
    sender: getNetworkEnv(
      'TOKEN_SENDER_REWARDS_FEE', //
      1,
    ),
    recipient: getNetworkEnv(
      'TOKEN_RECIPIENT_REWARDS_FEE', //
      1,
    ),
  };
  const TOKEN_TOTAL_SUPPLY = getNetworkEnv(
    'TOKEN_TOTAL_SUPPLY',
    BigNumber.from('10000000000000000000000000000'), // 10,000,000,000.000000000000000000
  );
  const TOKEN_MIN_TOTAL_SUPPLY = getNetworkEnv(
    'TOKEN_MIN_TOTAL_SUPPLY',
    BigNumber.from('100000000000000000000000000'), // 100,000,000.000000000000000000
  );

  // presale

  const PRESALE_TOKENS_AMOUNT_PER_NATIVE = getNetworkEnv(
    'PRESALE_TOKENS_AMOUNT_PER_NATIVE',
    BigNumber.from('200000'), // 200000
  );
  const PRESALE_MAX_PURCHASE_PRICE = getNetworkEnv(
    'PRESALE_MAX_PURCHASE_PRICE',
    BigNumber.from('10000000000000000000'), // 10.000000000000000000
  );
  const PRESALE_TOTAL_TOKENS = getNetworkEnv(
    'PRESALE_TOTAL_TOKENS',
    BigNumber.from('1000000000000000000000000000'), // 1,000,000,000.000000000000000000
  );

  const { from } = await getNamedAccounts();

  // initialize

  // lpm

  if (await read(ContractNames.MetaheroLPMForUniswapV2, 'initialized')) {
    log(`${ContractNames.MetaheroLPMForUniswapV2} already initialized`);
  } else {
    const { address: token } = await get(ContractNames.MetaheroToken);

    await execute(
      ContractNames.MetaheroLPMForUniswapV2,
      {
        from,
        log: true,
      },
      'initialize',
      LPM_ENABLE_BURN_LP_AT_VALUE,
      knownContracts.getAddress(ContractNames.StableCoin),
      token,
      knownContracts.getAddress(ContractNames.UniswapV2Router),
    );
  }

  // token

  if (await read(ContractNames.MetaheroToken, 'initialized')) {
    log(`${ContractNames.MetaheroToken} already initialized`);
  } else {
    const { address: lpm } = await get(ContractNames.MetaheroLPMForUniswapV2);

    const uniswapPair = await read(
      ContractNames.MetaheroLPMForUniswapV2,
      'uniswapPair',
    );

    await execute(
      ContractNames.MetaheroToken,
      {
        from,
        log: true,
      },
      'initialize',
      TOKEN_BURN_FEE,
      TOKEN_LP_FEE,
      TOKEN_REWARDS_FEE,
      TOKEN_MIN_TOTAL_SUPPLY,
      lpm,
      constants.AddressZero, // disable controller
      TOKEN_TOTAL_SUPPLY,
      [
        lpm, //
        uniswapPair,
      ],
    );
  }

  // presale

  if (await read(ContractNames.MetaheroPresale, 'initialized')) {
    log(`${ContractNames.MetaheroPresale} already initialized`);
  } else {
    const { address: presale } = await get(ContractNames.MetaheroPresale);
    const { address: token } = await get(ContractNames.MetaheroToken);

    await execute(
      ContractNames.MetaheroToken,
      {
        from,
        log: true,
      },
      'excludeAccount',
      presale,
      true,
      true,
    );

    if (PRESALE_TOTAL_TOKENS.gt(0)) {
      await execute(
        ContractNames.MetaheroToken,
        {
          from,
          log: true,
        },
        'transfer',
        presale,
        PRESALE_TOTAL_TOKENS,
      );
    }

    await execute(
      ContractNames.MetaheroPresale,
      {
        from,
        log: true,
      },
      'initialize',
      token,
      PRESALE_TOKENS_AMOUNT_PER_NATIVE,
      PRESALE_MAX_PURCHASE_PRICE,
    );

    const signers = await getSigners();

    // for local node only
    if (signers.length > 1) {
      await execute(
        ContractNames.MetaheroPresale,
        {
          from,
          log: true,
        },
        'addAccounts',
        signers.slice(1).map(({ address }) => address),
      );
    }
  }
};

func.tags = ['initialize'];
func.dependencies = ['deploy'];

module.exports = func;
