import { BigNumber, BigNumberish } from 'ethers';
import { ethers, waffle } from 'hardhat';
import { expect } from 'chai';
import HEROTokenArtifact from '../artifacts/HEROToken.json';
import HEROLPManagerMockArtifact from '../artifacts/HEROLPManagerMock.json';
import { HEROToken, HEROLPManagerMock } from '../typings';
import { Signer } from './helpers';

const { deployContract } = waffle;
const { getSigners } = ethers;

interface BeforeHookOptions {
  lpFee: {
    sender: number;
    recipient: number;
  };
  rewardsFee: this['lpFee'];
  initialize: boolean;
  finishPresale: boolean;
}

interface TransferAccountOptions {
  type: 'exclude' | 'holder';
  index: number;
  expectedBalance: BigNumberish;
}

describe('HEROToken', () => {
  const TOTAL_SUPPLY = BigNumber.from('10000000000000');

  let owner: Signer;
  let controller: Signer;
  let excluded: Signer[];
  let holders: Signer[];
  let token: HEROToken;
  let lpManager: HEROLPManagerMock;

  const createBeforeHook = (options: Partial<BeforeHookOptions> = {}) => {
    const { lpFee, rewardsFee, initialize, finishPresale } = {
      lpFee: {
        sender: 0,
        recipient: 0,
      },
      rewardsFee: {
        sender: 0,
        recipient: 0,
      },
      initialize: false,
      finishPresale: false,
      ...options,
    };

    before(async () => {
      let signers = await getSigners();

      [owner, controller, ...signers] = signers;

      excluded = [owner, signers[0]];
      holders = signers.slice(1);

      token = (await deployContract(owner, HEROTokenArtifact)) as HEROToken;
      lpManager = (await deployContract(
        owner,
        HEROLPManagerMockArtifact,
      )) as HEROLPManagerMock;

      if (initialize) {
        await token.initialize(
          lpFee,
          rewardsFee,
          lpManager.address,
          controller.address,
          TOTAL_SUPPLY,
          excluded.slice(1).map(({ address }) => address),
        );

        await lpManager.initialize(token.address);

        if (finishPresale) {
          await token.finishPresale();
        }
      }
    });
  };

  context('# metadata', () => {
    createBeforeHook();

    it('expect to return correct name', async () => {
      expect(await token.name()).to.equal('Metahero');
    });

    it('expect to return correct symbol', async () => {
      expect(await token.symbol()).to.equal('HERO');
    });

    it('expect to return correct decimals', async () => {
      expect(await token.decimals()).to.equal(18);
    });
  });

  context('transfer()', () => {
    context('# google spreadsheets scenario', () => {
      createBeforeHook({
        lpFee: {
          sender: 4,
          recipient: 4,
        },
        rewardsFee: {
          sender: 1,
          recipient: 1,
        },
        initialize: true,
        finishPresale: true,
      });

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
    });
  });
});
