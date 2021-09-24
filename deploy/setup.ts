import { DeployFunction } from 'hardhat-deploy/types';
import { BigNumber, constants } from 'ethers';
import { ContractNames, NetworkNames } from '../extensions';

const func: DeployFunction = async (hre) => {
  const {
    network: { name },
    deployments: { get, read, execute, log },
    getNamedAccounts,
    getNetworkEnv,
  } = hre;

  if (name === NetworkNames.Bsc) {
    return;
  }

  const AIR_DROP_BALANCE = getNetworkEnv(
    'AIR_DROP_BALANCE',
    BigNumber.from('100000000000000000000000000'), // 100,000,000.000000000000000000
  );

  const { from } = await getNamedAccounts();

  const { address: dao } = await get(ContractNames.MetaheroDAO);
  const { address: airDrop } = await get(ContractNames.MetaheroAirDrop);

  const airDropBalance = await read(
    ContractNames.MetaheroToken,
    'balanceOf',
    airDrop,
  );

  if (airDropBalance.lt(AIR_DROP_BALANCE)) {
    await execute(
      ContractNames.MetaheroToken,
      {
        from,
        log: true,
      },
      'transfer',
      airDrop,
      AIR_DROP_BALANCE.sub(airDropBalance),
    );
  }

  if (await read(ContractNames.MetaheroToken, 'presaleFinished')) {
    log(`${ContractNames.MetaheroToken} presale already finished`);
  } else {
    await execute(
      ContractNames.MetaheroToken,
      {
        from,
        log: true,
      },
      'setPresaleAsFinished',
    );
  }

  if (
    (await read(ContractNames.MetaheroToken, 'dao')) !== constants.AddressZero
  ) {
    log(`${ContractNames.MetaheroToken} dao already set`);
  } else {
    await execute(
      ContractNames.MetaheroToken,
      {
        from,
        log: true,
      },
      'setDAO',
      dao,
    );
  }
};

func.tags = ['setup'];
func.dependencies = ['initialize'];

module.exports = func;
