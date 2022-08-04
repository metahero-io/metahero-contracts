import { NetworkNames } from '@metahero/common-contracts/hardhat/shared/constants';
import { DeployFunction } from 'hardhat-deploy/types';

const func: DeployFunction = async (hre) => {
  const {
    network: { name },
    deployments: { deploy, log },
    helpers: { getAccounts },
  } = hre;

  log();
  log('# create');
  log();

  const [from] = await getAccounts();

  // dao

  await deploy('MetaheroDAO', {
    from,
    log: true,
  });

  log();

  // lpm

  await deploy('MetaheroLPMForUniswapV2', {
    from,
    log: true,
  });

  log();

  // token

  await deploy('MetaheroToken', {
    from,
    log: true,
  });

  // local swap

  if (name === NetworkNames.Local) {
    log();

    const { address: factory } = await deploy('SwapFactory', {
      contract: 'PancakeFactory',
      from,
      log: true,
      args: [from],
    });

    log();

    const { address: wrappedNative } = await deploy('SwapWrappedNative', {
      contract: 'WrappedNativeMock',
      from,
      log: true,
    });

    log();

    await deploy('SwapRouter', {
      contract: 'PancakeRouter',
      from,
      log: true,
      args: [factory, wrappedNative],
    });

    log();

    await deploy('SwapStableCoin', {
      contract: 'ERC20Mock',
      from,
      log: true,
    });
  }
};

func.tags = ['create'];

module.exports = func;
