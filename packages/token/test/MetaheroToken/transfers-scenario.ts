import { BigNumber, BigNumberish, constants } from 'ethers';
import { ethers, helpers } from 'hardhat';
import { expect } from 'chai';
import { MetaheroLPMMock, MetaheroToken } from '../../typechain';
import { Signer } from '../helpers';

const { getSigners } = ethers;

const { deployContract } = helpers;

interface TextCaseAccountOptions {
  type: 'exclude' | 'holder';
  index: number;
  expectedBalance: BigNumberish;
}

context('MetaheroToken', () => {
  context('# transfers scenario', () => {
    const TOTAL_SUPPLY = BigNumber.from('10000000000000');
    const BURN_FEE = {
      sender: 1,
      recipient: 1,
    };
    const LP_FEE = {
      sender: 3,
      recipient: 3,
    };
    const REWARDS_FEE = {
      sender: 1,
      recipient: 1,
    };

    let excluded: Signer[];
    let holders: Signer[];
    let token: MetaheroToken;
    let lpm: MetaheroLPMMock;

    before(async () => {
      const [, ...signers] = await getSigners();

      excluded = signers.slice(0, 2);
      holders = signers.slice(2);

      token = await deployContract('MetaheroToken');

      lpm = await deployContract('MetaheroLPMMock');

      await token.initialize(
        BURN_FEE,
        LP_FEE,
        REWARDS_FEE,
        0,
        lpm.address,
        constants.AddressZero,
        TOTAL_SUPPLY,
        excluded.map(({ address }) => address),
      );

      await token.transfer(excluded[0].address, TOTAL_SUPPLY);

      await lpm.initialize(token.address);

      await token.setPresaleAsFinished();
    });

    const createTestCase = (
      senderOptions: TextCaseAccountOptions,
      recipientOptions: TextCaseAccountOptions,
      amount: BigNumberish,
    ) => {
      const amountBN = BigNumber.from(amount);

      let title = `expect to transfer ${amountBN.toString()}`;

      title = `${title} from ${senderOptions.type}#${senderOptions.index}`;
      title = `${title} to ${recipientOptions.type}#${recipientOptions.index}`;

      it(title, async () => {
        const sender =
          senderOptions.type === 'exclude'
            ? excluded[senderOptions.index]
            : holders[senderOptions.index];

        const recipient =
          recipientOptions.type === 'exclude'
            ? excluded[recipientOptions.index]
            : holders[recipientOptions.index];

        await token.connect(sender).transfer(recipient.address, amountBN);

        const { expectedBalance } = senderOptions;
        const balance = await token.balanceOf(sender.address);

        expect(balance).to.eq(expectedBalance);

        {
          const { expectedBalance } = recipientOptions;
          const balance = await token.balanceOf(recipient.address);

          expect(balance).to.eq(expectedBalance);
        }
      });
    };

    createTestCase(
      {
        type: 'exclude',
        index: 0,
        expectedBalance: '9850000000000',
      },
      {
        type: 'exclude',
        index: 1,
        expectedBalance: '150000000000',
      },
      '150000000000',
    );

    createTestCase(
      {
        type: 'exclude',
        index: 0,
        expectedBalance: '9350000000000',
      },
      {
        type: 'holder',
        index: 0,
        expectedBalance: '480000000000',
      },
      '500000000000',
    );

    createTestCase(
      {
        type: 'holder',
        index: 0,
        expectedBalance: '272347826086',
      },
      {
        type: 'holder',
        index: 1,
        expectedBalance: '191652173912',
      },
      '200000000000',
    );

    createTestCase(
      {
        type: 'holder',
        index: 1,
        expectedBalance: '87033901551',
      },
      {
        type: 'holder',
        index: 2,
        expectedBalance: '95418502202',
      },
      '100000000000',
    );

    createTestCase(
      {
        type: 'holder',
        index: 0,
        expectedBalance: '116837035675',
      },
      {
        type: 'holder',
        index: 1,
        expectedBalance: '231095356663',
      },
      '150000000000',
    );

    createTestCase(
      {
        type: 'holder',
        index: 0,
        expectedBalance: '64419203027',
      },
      {
        type: 'exclude',
        index: 1,
        expectedBalance: '200000000000',
      },
      '50000000000',
    );

    // additional case for sending all tokens from the holder account

    createTestCase(
      {
        type: 'holder',
        index: 0,
        expectedBalance: '0',
      },
      {
        type: 'holder',
        index: 5,
        expectedBalance: '58469381406',
      },
      '61351621933',
    );
  });
});
