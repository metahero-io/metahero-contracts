import { constants } from 'ethers';
import { DeployFunction } from 'hardhat-deploy/types';
import { NetworkChainIds } from '../extensions';

const LP_FEE = {
  sender: 4,
  recipient: 4,
};
const REWARDS_FEE = {
  sender: 1,
  recipient: 1,
};

const func: DeployFunction = async (hre) => {
  const {
    network: {
      config: { chainId },
    },
    deployments: { get, read, execute, log },
    getNamedAccounts,
  } = hre;
  const { from } = await getNamedAccounts();

  if (await read('HEROToken', 'initialized')) {
    log('HEROToken already initialized');
  } else {
    const { address: whitelist } = await get('HEROWhitelist');

    const excluded: string[] = [
      whitelist, //
    ];

    let swapRouter = constants.AddressZero;

    switch (chainId) {
      case NetworkChainIds.Bsc:
        swapRouter = '0x05ff2b0db69458a0750badebc4f9e13add608c7f';
        break;

      case NetworkChainIds.BscTest:
        swapRouter = '0xD99D1c33F9fC3444f8101754aBC46c52416550D1';
        break;
    }

    await execute(
      'HEROToken',
      {
        from,
        log: true,
      },
      'initialize',
      LP_FEE,
      REWARDS_FEE,
      0, // use default totalSupply
      excluded,
      swapRouter,
    );
  }
};

func.id = 'initializeHEROToken';
func.tags = [
  'initialize', //
  'HEROToken',
];
func.dependencies = [
  'deployHEROToken', //
  'deployHEROWhitelist',
];

module.exports = func;
