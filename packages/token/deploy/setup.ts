import { DeployFunction } from 'hardhat-deploy/types';
import { constants } from 'ethers';
import { ContractNames } from '../extensions';

const func: DeployFunction = async (hre) => {
  const {
    deployments: { get, read, execute, log },
    getNamedAccounts,
  } = hre;

  const { from } = await getNamedAccounts();

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
    const { address: dao } = await get(ContractNames.MetaheroDAO);

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
