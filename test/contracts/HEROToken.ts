import { HEROTokenHelper } from '../helpers';
import { increaseTime } from '../utils';

describe('HEROToken', () => {
  const cycleLength = 5; // 5 sec

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
      cycleLength,
      cycleWeightGain: 2,
      excludedAccounts: 5,
      totalSupply: '100000000000000000',
    });

    await helper.deploy();
    await helper.initialize();
  });

  beforeEach(async () => {
    await increaseTime(cycleLength);
  });

  context('transfer()', () => {
    it.skip('expect to transfer 100 from excluded #0 to excluded #1', async () => {
      await helper.transfer(
        'excluded', //
        0,
        'excluded',
        1,
        100,
      );
    });

    it('expect to transfer 5000000 from excluded #0 to holder #0', async () => {
      await helper.transfer(
        'excluded', //
        0,
        'holder',
        0,
        5000000,
      );
    });

    it('expect to transfer 10000000 from excluded #0 to holder #1', async () => {
      await helper.transfer(
        'excluded', //
        0,
        'holder',
        1,
        10000000,
      );
    });
  });
});
