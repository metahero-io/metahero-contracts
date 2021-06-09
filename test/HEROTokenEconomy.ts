import { ethers, waffle } from 'hardhat';
import { BigNumber, BigNumberish } from 'ethers';
import HEROTokenArtifact from '../artifacts/HEROToken.json';
import { HEROToken } from '../typings';
import { Signer } from './common';

const { deployContract } = waffle;
const { getSigners } = ethers;

interface TransferAccountOptions {
  type: 'exclude' | 'holder';
  index: number;
}

describe('HEROTokenEconomy', () => {
  const PRECISION = 10 ** 9;
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
  let token: HEROToken;

  before(async () => {
    const signers = await getSigners();

    excluded = signers.slice(0, 2);
    holders = signers.slice(2);

    token = (await deployContract(excluded[0], HEROTokenArtifact)) as HEROToken;

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

        const senderBalance = await token.balanceOf(sender.address);
        const recipientBalance = await token.balanceOf(recipient.address);

        console.log();
        console.log(
          `${' '.repeat(6)}sender balance:`,
          senderBalance.toString(),
        );
        console.log(
          `${' '.repeat(6)}recipient balance:`,
          recipientBalance.toString(),
        );
      });
    };

    createTestCase(
      {
        type: 'exclude',
        index: 0,
      },
      {
        type: 'exclude',
        index: 1,
      },
      150,
    );

    createTestCase(
      {
        type: 'exclude',
        index: 0,
      },
      {
        type: 'holder',
        index: 0,
      },
      500,
    );

    createTestCase(
      {
        type: 'holder',
        index: 0,
      },
      {
        type: 'holder',
        index: 1,
      },
      200,
    );

    createTestCase(
      {
        type: 'holder',
        index: 1,
      },
      {
        type: 'holder',
        index: 2,
      },
      100,
    );

    createTestCase(
      {
        type: 'holder',
        index: 0,
      },
      {
        type: 'holder',
        index: 1,
      },
      150,
    );

    createTestCase(
      {
        type: 'holder',
        index: 0,
      },
      {
        type: 'exclude',
        index: 1,
      },
      50,
    );
  });
});
