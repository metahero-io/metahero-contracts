import { ethers, waffle } from 'hardhat';
import { expect } from 'chai';
import { BigNumber, BigNumberish } from 'ethers';
import HEROTokenEconomyMockArtifact from '../artifacts/HEROTokenEconomyMock.json';
import { HEROTokenEconomyMock } from '../typings';
import { Signer, PRECISION } from './common';

const { deployContract } = waffle;
const { getSigners } = ethers;

interface TransferAccountOptions {
  type: 'exclude' | 'holder';
  index: number;
  expectedBalance: BigNumberish;
}

describe('HEROTokenEconomy', () => {
  const LP_FEE = {
    sender: 4,
    recipient: 4,
  };
  const REWARDS_FEE = {
    sender: 1,
    recipient: 1,
  };
  const TOTAL_SUPPLY = BigNumber.from(10000);

  let excluded: Signer[];
  let holders: Signer[];
  let token: HEROTokenEconomyMock;

  before(async () => {
    const signers = await getSigners();

    excluded = signers.slice(0, 2);
    holders = signers.slice(2);

    token = (await deployContract(
      excluded[0],
      HEROTokenEconomyMockArtifact,
    )) as HEROTokenEconomyMock;

    await token.initialize(
      LP_FEE,
      REWARDS_FEE,
      TOTAL_SUPPLY.mul(PRECISION),
      excluded.slice(1).map(({ address }) => address),
    );
  });

  context('transfer()', () => {
    const createTestCase = (
      senderOptions: TransferAccountOptions,
      recipientOptions: TransferAccountOptions,
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

        await token
          .connect(sender)
          .transfer(recipient.address, amountBN.mul(PRECISION));

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
      150,
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
      500,
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
      200,
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
      100,
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
      150,
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
      50,
    );
  });
});