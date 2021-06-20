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
    'LP_MANAGER_UNISWAP_V2_ENABLE_BURN_LP_AT_VALUE',
    BigNumber.from('10000000000000000000000000'), // 10,000,000.000000000000000000
  );

  const { from } = await getNamedAccounts();

  if (await read(ContractNames.HEROLPManagerUniswapV2, 'initialized')) {
    log(`${ContractNames.HEROLPManagerUniswapV2} already initialized`);
  } else {
    const { address: token } = await get(ContractNames.HEROToken);
    const pancakeSwapRouter = knownContracts.getAddress('PancakeSwapRouter');

    await execute(
      ContractNames.HEROLPManagerUniswapV2,
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

    const pancakeSwapTokenPair = await read(
      ContractNames.HEROLPManagerUniswapV2,
      'uniswapTokenPair',
    );

    await execute(
      ContractNames.HEROToken,
      {
        from,
        log: true,
      },
      'excludeAccount',
      pancakeSwapRouter,
      true,
    );

    await execute(
      ContractNames.HEROToken,
      {
        from,
        log: true,
      },
      'excludeAccount',
      pancakeSwapTokenPair,
      true,
    );
  }
};

func.tags = [
  'initialize', //
  ContractNames.HEROLPManagerUniswapV2,
];
func.dependencies = [
  'deploy', //
  ContractNames.HEROToken,
];

module.exports = func;
