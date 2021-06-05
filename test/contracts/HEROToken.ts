import { HEROTokenHelper } from '../helpers';

describe('HEROToken', () => {
  let helper: HEROTokenHelper;

  before(async () => {
    helper = await HEROTokenHelper.getInstance({
      lpFees: {
        sender: 1,
        recipient: 1,
      },
      rewardsFees: {
        sender: 1,
        recipient: 1,
      },
      cycleLength: 5,
      cycleWeightGain: 2,
      excludedAccounts: 5,
      totalSupply: '100000000000000000',
    });

    await helper.deploy();
    await helper.initialize();
  });

  context('transfer()', () => {
    it('expect to transfer 100 from excluded #0 to excluded #1', async () => {
      await helper.transfer(
        'excluded', //
        0,
        'excluded',
        1,
        100,
      );
    });

    it('expect to transfer 1000 from excluded #1 to holder #0', async () => {
      await helper.transfer(
        'excluded', //
        0,
        'holder',
        0,
        1000,
      );
    });

    it('expect to transfer 1000 from excluded #0 to holder #1', async () => {
      await helper.transfer(
        'excluded', //
        0,
        'holder',
        1,
        1000,
      );
    });
  });
});
