import { BigNumber, constants } from 'ethers';
import { DeployFunction } from 'hardhat-deploy/types';
import { ContractNames } from '../extensions';

const func: DeployFunction = async (hre) => {
  const {
    deployments: { get, read, execute, log },
    getNamedAccounts,
    getNetworkEnv,
  } = hre;

  const { from } = await getNamedAccounts();
  const { address: token } = await get(ContractNames.MetaheroToken);

  // token

  if (await read(ContractNames.MetaheroToken, 'initialized')) {
    log(`${ContractNames.MetaheroToken} already initialized`);
  } else {
    const { address: lpm } = await get(ContractNames.MetaheroLPMForUniswapV2);

    const uniswapPair = await read(
      ContractNames.MetaheroLPMForUniswapV2,
      'uniswapPair',
    );

    const ZERO_FEE = {
      sender: 0,
      recipient: 0,
    };
    const LP_FEE = {
      sender: 1,
      recipient: 1,
    };

    const TOTAL_SUPPLY = getNetworkEnv(
      'TOKEN_TOTAL_SUPPLY',
      BigNumber.from('9766213274195872160839915066'), // 9,766,213,274.195872160839915066
    );
    const MIN_TOTAL_SUPPLY = getNetworkEnv(
      'TOKEN_MIN_TOTAL_SUPPLY',
      BigNumber.from('100000000000000000000000000'), // 100,000,000.000000000000000000
    );

    await execute(
      ContractNames.MetaheroToken,
      {
        from,
        log: true,
      },
      'initialize',
      ZERO_FEE,
      LP_FEE,
      ZERO_FEE,
      MIN_TOTAL_SUPPLY,
      lpm,
      constants.AddressZero, // disable controller
      TOTAL_SUPPLY,
      [
        lpm, //
        uniswapPair,
      ],
    );
  }

  // dao

  if (await read(ContractNames.MetaheroDAO, 'initialized')) {
    log(`${ContractNames.MetaheroDAO} already initialized`);
  } else {
    const MIN_VOTING_PERIOD = getNetworkEnv(
      'DAO_MIN_VOTING_PERIOD',
      24 * 60 * 60, // 1 day
    );

    const SNAPSHOT_WINDOW = getNetworkEnv(
      'DAO_SNAPSHOT_WINDOW',
      24 * 60 * 60, // 1 day
    );

    await execute(
      ContractNames.MetaheroDAO,
      {
        from,
        log: true,
      },
      'initialize',
      token,
      constants.AddressZero, // use token owner
      MIN_VOTING_PERIOD,
      SNAPSHOT_WINDOW,
    );
  }

  // TODO: lpm
  //
  // if (await read(ContractNames.MetaheroLPMForUniswapV2, 'initialized')) {
  //   log(`${ContractNames.MetaheroLPMForUniswapV2} already initialized`);
  // } else {
  //   await execute(
  //     ContractNames.MetaheroLPMForUniswapV2,
  //     {
  //       from,
  //       log: true,
  //     },
  //     'initialize',
  //     token,
  //   );
  // }
};

func.tags = ['initialize'];
func.dependencies = ['deploy'];

module.exports = func;
