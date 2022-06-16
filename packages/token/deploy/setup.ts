import { DeployFunction } from 'hardhat-deploy/types';
import { constants } from 'ethers';

const func: DeployFunction = async (hre) => {
  const {
    deployments: { get, read, execute, log },
    helpers: { getAccounts },
  } = hre;

  const [from] = await getAccounts();

  if (await read('MetaheroToken', 'presaleFinished')) {
    log('MetaheroToken presale already finished');
  } else {
    await execute(
      'MetaheroToken',
      {
        from,
        log: true,
      },
      'setPresaleAsFinished',
    );
  }

  if ((await read('MetaheroToken', 'dao')) !== constants.AddressZero) {
    log('MetaheroToken dao already set');
  } else {
    const { address: dao } = await get('MetaheroDAO');

    await execute(
      'MetaheroToken',
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
