import { BigNumber } from 'ethers';
import { DeployFunction } from 'hardhat-deploy/types';
import { ContractNames } from '../extensions';

const func: DeployFunction = async (hre) => {
  const {
    deployments: { get, read, execute, log },
    getNamedAccounts,
    getNetworkEnv,
    knownContracts,
  } = hre;

  // settings

  const ENABLE_BURN_LP_AT_VALUE = getNetworkEnv(
    'LP_MANAGER_FOR_UNISWAP_V2_ENABLE_BURN_LP_AT_VALUE',
    BigNumber.from('10000000000000000000000000'), // 10,000,000.000000000000000000
  );

  const { from } = await getNamedAccounts();

  if (await read(ContractNames.HEROLPManagerForUniswapV2, 'initialized')) {
    log(`${ContractNames.HEROLPManagerForUniswapV2} already initialized`);
  } else {
    const { address: token } = await get(ContractNames.HEROToken);
    const pancakeSwapRouter = knownContracts.getAddress('PancakeSwapRouter');

    await execute(
      ContractNames.HEROLPManagerForUniswapV2,
      {
        from,
        log: true,
      },
      'initialize',
      ENABLE_BURN_LP_AT_VALUE,
      knownContracts.getAddress('BUSDToken'),
      token,
      knownContracts.getAddress('PancakeSwapRouter'),
    );

    const pancakeSwapPair = await read(
      ContractNames.HEROLPManagerForUniswapV2,
      'uniswapPair',
    );

    await execute(
      ContractNames.HEROToken,
      {
        from,
        log: true,
      },
      'excludeAccount',
      pancakeSwapRouter,
      false,
      false,
    );

    await execute(
      ContractNames.HEROToken,
      {
        from,
        log: true,
      },
      'excludeAccount',
      pancakeSwapPair,
      false,
      false,
    );
  }
};

func.tags = [
  'initialize', //
  ContractNames.HEROLPManager,
];
func.dependencies = [
  'deploy', //
  ContractNames.HEROToken,
];

module.exports = func;
