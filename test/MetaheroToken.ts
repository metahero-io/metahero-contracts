import { BigNumber, BigNumberish, constants } from 'ethers';
import { ethers, waffle } from 'hardhat';
import { expect } from 'chai';
import MetaheroTokenArtifact from '../artifacts/MetaheroToken.json';
import MetaheroLPMMockArtifact from '../artifacts/MetaheroLPMMock.json';
import { MetaheroToken, MetaheroLPMMock } from '../typings';
import { randomAddress, Signer } from './helpers';

const { deployContract } = waffle;
const { getSigners } = ethers;

interface BeforeHookOptions {
  burnFee: {
    sender: number;
    recipient: number;
  };
  controller: string;
  lpm: string;
  lpFee: this['burnFee'];
  rewardsFee: this['burnFee'];
  initialize: boolean;
  finishPresale: boolean;
  minTotalSupply: BigNumberish;
  totalSupply: BigNumberish;
  postBefore: () => Promise<void>;
}

interface TransferAccountOptions {
  type: 'exclude' | 'holder';
  index: number;
  expectedBalance: BigNumberish;
}

describe('MetaheroToken', () => {
  const TOTAL_SUPPLY = BigNumber.from('10000000000000');
  const MIN_TOTAL_SUPPLY = BigNumber.from('100000000000');
  const ZERO_FEE = {
    sender: 0,
    recipient: 0,
  };

  let owner: Signer;
  let controller: Signer;
  let excluded: Signer[];
  let holders: Signer[];
  let token: MetaheroToken;
  let lpm: MetaheroLPMMock;

  before(async () => {
    let signers = await getSigners();

    [owner, controller, ...signers] = signers;

    excluded = signers.slice(0, 2);
    holders = signers.slice(2);
  });

  const createBeforeHook = (options: Partial<BeforeHookOptions> = {}) => {
    const {
      burnFee,
      lpFee,
      rewardsFee,
      initialize,
      finishPresale,
      postBefore,
      controller: controllerAddress,
      lpm: lpmAddress,
      totalSupply,
      minTotalSupply,
    } = {
      burnFee: ZERO_FEE,
      lpFee: ZERO_FEE,
      rewardsFee: ZERO_FEE,
      initialize: true,
      finishPresale: false,
      totalSupply: TOTAL_SUPPLY,
      minTotalSupply: MIN_TOTAL_SUPPLY,
      ...options,
    };

    before(async () => {
      token = (await deployContract(
        owner,
        MetaheroTokenArtifact,
      )) as MetaheroToken;
      lpm = null;

      let controllerParam: string;
      let lpmParam: string;

      if (controllerAddress === null) {
        controllerParam = constants.AddressZero;
      } else if (controllerAddress) {
        controllerParam = controllerAddress;
      } else {
        controllerParam = controller.address;
      }

      if (lpmAddress === null) {
        lpmParam = constants.AddressZero;
      } else if (lpmAddress) {
        lpmParam = lpmAddress;
      } else {
        lpm = (await deployContract(
          owner,
          MetaheroLPMMockArtifact,
        )) as MetaheroLPMMock;

        lpmParam = lpm.address;
      }

      if (initialize) {
        await token.initialize(
          burnFee,
          lpFee,
          rewardsFee,
          minTotalSupply,
          lpmParam,
          controllerParam,
          totalSupply,
          excluded.map(({ address }) => address),
        );

        if (totalSupply) {
          await token.transfer(excluded[0].address, totalSupply);
        }

        if (lpm) {
          await lpm.initialize(token.address);
        }

        if (finishPresale) {
          await token.finishPresale();
        }
      }

      if (postBefore) {
        await postBefore();
      }
    });
  };

  context('# metadata', () => {
    createBeforeHook({
      initialize: false,
    });

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

  context('initialize()', () => {
    createBeforeHook({
      initialize: false,
    });

    it('expect to revert when sender is not the initializer', async () => {
      await expect(
        token
          .connect(holders[0])
          .initialize(
            ZERO_FEE,
            ZERO_FEE,
            ZERO_FEE,
            0,
            constants.AddressZero,
            constants.AddressZero,
            0,
            [],
          ),
      ).to.be.revertedWith('Initializable#2');
    });

    it('expect to revert when lp manager is the zero address', async () => {
      await expect(
        token.initialize(
          ZERO_FEE,
          {
            sender: 1,
            recipient: 1,
          },
          ZERO_FEE,
          0,
          constants.AddressZero,
          constants.AddressZero,
          0,
          [],
        ),
      ).to.be.revertedWith('MetaheroToken#1');
    });

    it('expect to initialize the contract', async () => {
      const tx = await token.initialize(
        ZERO_FEE,
        ZERO_FEE,
        ZERO_FEE,
        0,
        constants.AddressZero,
        constants.AddressZero,
        0,
        [],
      );

      expect(tx).to.emit(token, 'Initialized');
    });

    it('expect to revert when the contract is initialized', async () => {
      await expect(
        token.initialize(
          ZERO_FEE,
          ZERO_FEE,
          ZERO_FEE,
          0,
          constants.AddressZero,
          constants.AddressZero,
          0,
          [],
        ),
      ).to.be.revertedWith('Initializable#1');
    });
  });

  context('finishPresale()', () => {
    createBeforeHook({
      finishPresale: false,
    });

    it('expect to revert when sender is not the owner', async () => {
      await expect(
        token.connect(holders[0]).finishPresale(),
      ).to.be.revertedWith('Owned#1');
    });

    it('expect to finish presale', async () => {
      const tx = await token.finishPresale();

      expect(tx).to.emit(token, 'PresaleFinished');
    });

    it('expect to revert when presale is finished', async () => {
      await expect(token.finishPresale()).to.be.revertedWith('MetaheroToken#2');
    });
  });

  context('excludeAccount()', () => {
    const account = randomAddress();
    const holder = randomAddress();

    createBeforeHook({
      postBefore: async () => {
        await token.connect(excluded[0]).transfer(holder, 10);
      },
    });

    it('expect to revert when sender is not the owner', async () => {
      await expect(
        token.connect(holders[0]).excludeAccount(randomAddress(), false, false),
      ).to.be.revertedWith('Owned#1');
    });

    it('expect to revert when account is the zero address', async () => {
      await expect(
        token.excludeAccount(constants.AddressZero, false, false),
      ).to.be.revertedWith('MetaheroToken#4');
    });

    it('expect to revert when account already exist', async () => {
      await expect(
        token.excludeAccount(excluded[1].address, false, false),
      ).to.be.revertedWith('MetaheroToken#5');
    });

    it('expect to revert when account is the holder', async () => {
      await expect(
        token.excludeAccount(holder, false, false),
      ).to.be.revertedWith('MetaheroToken#6');
    });

    it('expect to exclude fresh account', async () => {
      const tx = await token.excludeAccount(account, false, false);

      expect(tx)
        .to.emit(token, 'AccountExcluded')
        .withArgs(account, false, false);
    });

    it('expect to update excluded account', async () => {
      const account = randomAddress();

      const tx = await token.excludeAccount(account, true, false);

      expect(tx)
        .to.emit(token, 'AccountExcluded')
        .withArgs(account, true, false);
    });
  });

  context('mint()', () => {
    createBeforeHook();

    it('expect to revert when sender is not the controller', async () => {
      await expect(token.mint(randomAddress(), 10)).to.be.revertedWith(
        'Controlled#1',
      );
    });

    it('expect to revert when account is the zero address', async () => {
      await expect(
        token.connect(controller).mint(constants.AddressZero, 10),
      ).to.be.revertedWith('MetaheroToken#9');
    });

    it('expect to revert when amount is zero', async () => {
      await expect(
        token.connect(controller).mint(excluded[0].address, 0),
      ).to.be.revertedWith('MetaheroToken#10');
    });

    it('expect to revert when account is not excluded', async () => {
      await expect(
        token.connect(controller).mint(randomAddress(), 10),
      ).to.be.revertedWith('MetaheroToken#11');
    });

    it('expect to mint tokens', async () => {
      const account = excluded[0].address;
      const amount = 100;

      const tx = await token.connect(controller).mint(account, amount);

      expect(tx)
        .to.emit(token, 'Transfer')
        .withArgs(constants.AddressZero, account, amount);
    });
  });

  context('allowance()', () => {
    const spender = randomAddress();
    const allowance = 100;

    createBeforeHook({
      postBefore: async () => {
        await token.connect(holders[0]).approve(spender, allowance);
      },
    });

    it('expect to return correct allowances', async () => {
      expect(await token.allowance(randomAddress(), randomAddress())).to.equal(
        0,
      );
      expect(await token.allowance(holders[0].address, spender)).to.equal(
        allowance,
      );
    });
  });

  context('getBalanceSummary()', () => {
    const transferAmount = 100000;
    const recipientFee = 5;

    createBeforeHook({
      rewardsFee: {
        sender: 0,
        recipient: recipientFee,
      },
      finishPresale: true,
      postBefore: async () => {
        await token
          .connect(excluded[0])
          .transfer(holders[1].address, transferAmount);
      },
    });

    it('expect to return correct balance summary', async () => {
      const output = await token.getBalanceSummary(holders[1].address);

      expect(output.totalBalance).to.equal(transferAmount);
      expect(output.holdingBalance).to.equal(
        (transferAmount * (100 - recipientFee)) / 100,
      );
      expect(output.totalRewards).to.equal(
        (transferAmount * recipientFee) / 100,
      );
    });
  });

  context('transferFrom()', () => {
    const allowance = 100;
    let spender: Signer;

    createBeforeHook({
      postBefore: async () => {
        spender = holders[0];
        await token.connect(excluded[0]).approve(spender.address, allowance);
      },
      finishPresale: true,
    });

    it('expect to revert when amount exceeds allowance', async () => {
      await expect(
        token
          .connect(spender)
          .transferFrom(excluded[0].address, randomAddress(), allowance + 1),
      ).to.be.revertedWith('MetaheroToken#3');
    });

    it('expect to transfer from', async () => {
      const recipient = randomAddress();

      await token
        .connect(spender)
        .transferFrom(excluded[0].address, recipient, allowance);

      expect(
        await token.allowance(holders[0].address, spender.address),
      ).to.equal(0);
    });
  });

  context('transfer()', () => {
    context('_transferFromExcludedAccount()', () => {
      createBeforeHook({
        burnFee: {
          sender: 1,
          recipient: 1,
        },
        lpFee: {
          sender: 3,
          recipient: 3,
        },
        rewardsFee: {
          sender: 1,
          recipient: 1,
        },
        finishPresale: true,
      });

      it('expect to sync lp before transfer', async () => {
        const amount = 100;
        const sender = excluded[0];
        const recipient = holders[1];

        await lpm.allowSyncLP(true, false);

        const tx = await token
          .connect(sender)
          .transfer(recipient.address, amount);

        expect(tx).to.emit(lpm, 'LPSynced');
      });

      it('expect to sync lp after transfer', async () => {
        const amount = 100;
        const sender = excluded[0];
        const recipient = holders[2];

        await lpm.allowSyncLP(false, true);

        const tx = await token
          .connect(sender)
          .transfer(recipient.address, amount);

        expect(tx).to.emit(lpm, 'LPSynced');
      });

      it('expect not to sync lp', async () => {
        const amount = 100;
        const sender = excluded[0];
        const recipient = holders[3];

        await lpm.allowSyncLP(false, false);

        const tx = await token
          .connect(sender)
          .transfer(recipient.address, amount);

        expect(tx).not.to.emit(lpm, 'LPSynced');
      });
    });

    context('# google spreadsheets scenario', () => {
      createBeforeHook({
        burnFee: {
          sender: 1,
          recipient: 1,
        },
        lpFee: {
          sender: 3,
          recipient: 3,
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
});
