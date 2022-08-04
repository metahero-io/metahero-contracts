import { DeployFunction } from 'hardhat-deploy/types';
import { BigNumber, constants } from 'ethers';

const func: DeployFunction = async (hre) => {
  const {
    deployments: { get, read, execute, log },
    helpers: { getAccounts },
  } = hre;

  log();
  log('# setup');
  log();

  const [from] = await getAccounts();

  // finish presale

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

  log();

  // set DAO

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

  log();

  // set token lp fees

  const {
    lpFees,
  }: {
    lpFees: { sender: BigNumber; recipient: BigNumber };
  } = await read('MetaheroToken', 'settings');

  if (lpFees.sender.eq(0) && lpFees.sender.eq(0)) {
    log('MetaheroToken lp fees already removed');
  } else {
    await execute(
      'MetaheroDAO',
      {
        from,
        log: true,
      },
      'removeAllTokenFees',
    );
  }
};

func.tags = ['setup'];
func.dependencies = ['initialize'];

module.exports = func;
