import { ethers, waffle } from 'hardhat';
import { expect } from 'chai';
import { BigNumber } from 'ethers';
import HEROTokenEconomyMockArtifact from '../artifacts/HEROTokenEconomyMock.json';
import HEROPresaleArtifact from '../artifacts/HEROPresale.json';
import { HEROTokenEconomyMock, HEROPresale } from '../typings';
import {
  Signer,
  setNextBlockTimestamp,
  getBalance,
  calcTxCost,
  randomAddress,
} from './common';

const { deployContract } = waffle;
const { getSigners } = ethers;

describe('HEROPresale', () => {
  const UNIT_PRICE = BigNumber.from(1000);
  const UNIT_TOKENS = BigNumber.from(10);
  const DEADLINE_IN = 60; // 60 sec

  let token: HEROTokenEconomyMock;
  let whitelist: HEROPresale;
  let controller: Signer;
  let external: Signer;
  let accounts: Signer[];
  let unclaimedTokens: BigNumber;
  let deadline: number;

  const createBeforeHook = (initialize = true) => {
    before(async () => {
      [controller, external, ...accounts] = await getSigners();

      token = (await deployContract(
        controller,
        HEROTokenEconomyMockArtifact,
      )) as HEROTokenEconomyMock;

      whitelist = (await deployContract(
        controller,
        HEROPresaleArtifact,
      )) as HEROPresale;

      unclaimedTokens = BigNumber.from(accounts.length).mul(UNIT_TOKENS);

      const fee = {
        sender: 0,
        recipient: 0,
      };

      await token.initialize(
        fee, //
        fee,
        false,
        0,
        [
          whitelist.address, //
          ...accounts.map(({ address }) => address),
        ],
      );

      await token.transfer(whitelist.address, unclaimedTokens);

      if (initialize) {
        deadline = (await setNextBlockTimestamp()) + DEADLINE_IN;

        await whitelist.initialize(
          token.address,
          DEADLINE_IN,
          UNIT_PRICE,
          UNIT_TOKENS,
          accounts.map(({ address }) => address),
        );
      }
    });
  };

  context('# before initialization', () => {
    createBeforeHook(false);

    context('initialize()', () => {
      it('expect to initialize the whitelist', async () => {
        const tx = await whitelist.initialize(
          token.address,
          0,
          UNIT_PRICE,
          UNIT_TOKENS,
          accounts.map(({ address }) => address),
        );

        expect(tx).to.emit(whitelist, 'Initialized');

        for (const { address } of accounts) {
          expect(tx).to.emit(whitelist, 'AccountAdded').withArgs(address);
        }

        expect(await token.balanceOf(whitelist.address)).to.equal(
          unclaimedTokens,
        );
      });

      it('expect to revert when whitelist is initialized', async () => {
        await expect(
          whitelist.initialize(
            token.address,
            0,
            UNIT_PRICE,
            UNIT_TOKENS,
            accounts.map(({ address }) => address),
          ),
        ).to.be.revertedWith('Initializable: already initialized');
      });
    });
  });

  context('# after initialization', () => {
    createBeforeHook(true);

    context('deadline()', () => {
      it('expect to return correct deadline', async () => {
        const output = await whitelist.deadline();

        expect(output).to.equal(deadline);
      });
    });

    context('unitPrice()', () => {
      it('expect to return correct unit price', async () => {
        const output = await whitelist.unitPrice();

        expect(output).to.equal(UNIT_PRICE);
      });
    });

    context('unitTokens()', () => {
      it('expect to return correct unit tokens', async () => {
        const output = await whitelist.unitTokens();

        expect(output).to.equal(UNIT_TOKENS);
      });
    });

    context('pendingAccounts()', () => {
      it('expect to return correct pending accounts', async () => {
        const output = await whitelist.pendingAccounts();

        expect(output).to.equal(accounts.length);
      });
    });

    context('pendingTokens()', () => {
      it('expect to return correct pending tokens', async () => {
        const output = await whitelist.pendingTokens();

        expect(output).to.equal(unclaimedTokens);
      });
    });

    context('addAccounts()', () => {
      const ACCOUNTS = [
        randomAddress(), //
        randomAddress(),
        randomAddress(),
      ];

      before(async () => {
        const accountsTokens = UNIT_TOKENS.mul(accounts.length);
        await token.transfer(whitelist.address, accountsTokens);
      });

      it('expect to add accounts to whitelist', async () => {
        await whitelist.addAccounts(ACCOUNTS);
      });
    });

    context('# before deadline', () => {
      context('buyUnit()', () => {
        let account: Signer;

        before(() => {
          account = accounts.pop();
        });

        it('expect to revert when sender is not on the whitelist', async () => {
          await expect(
            whitelist.connect(external).buyUnit(),
          ).to.be.revertedWith('HEROPresale: msg.sender not on the whitelist');
        });

        it('expect to revert when sender is not on the whitelist', async () => {
          await expect(
            whitelist.connect(external).buyUnit(),
          ).to.be.revertedWith('HEROPresale: msg.sender not on the whitelist');
        });

        it('expect to revert on invalid msg.value', async () => {
          await expect(whitelist.connect(account).buyUnit()).to.be.revertedWith(
            'HEROPresale: invalid msg.value',
          );
        });

        it('expect to buy tokens', async () => {
          expect(await whitelist.whitelist(account.address)).to.be.true;

          const tx = await whitelist.connect(account).buyUnit({
            value: UNIT_PRICE,
          });

          expect(tx).to.emit(whitelist, 'UnitBought').withArgs(account.address);

          expect(await token.balanceOf(account.address)).to.be.equal(
            UNIT_TOKENS,
          );

          expect(await whitelist.whitelist(account.address)).to.be.false;
        });
      });

      context('destroy()', () => {
        it('expect to revert before deadline', async () => {
          await expect(whitelist.destroy()).to.be.revertedWith(
            'HEROPresale: can not destroy before deadline',
          );
        });
      });
    });

    context('# after deadline', () => {
      before(async () => {
        await setNextBlockTimestamp(deadline + DEADLINE_IN);
      });

      context('claimTokens()', () => {
        it('expect to revert before deadline', async () => {
          const claimer = accounts.pop();

          await expect(whitelist.connect(claimer).buyUnit()).to.be.revertedWith(
            'HEROPresale: can not buy after deadline',
          );
        });
      });

      context('destroy()', async () => {
        it('expect to destroy the whitelist', async () => {
          const summaryBefore = await token.summary();
          const controllerBalance = await getBalance(controller);
          const whitelistBalance = await getBalance(whitelist);
          const whitelistTokens = await token.balanceOf(whitelist.address);

          const tx = await whitelist.destroy();
          const txCost = await calcTxCost(tx);

          const summaryAfter = await token.summary();

          expect(await summaryAfter.totalSupply).to.equal(
            summaryBefore.totalSupply.sub(whitelistTokens),
          );

          expect(await summaryAfter.totalExcluded).to.equal(
            summaryBefore.totalExcluded.sub(whitelistTokens),
          );

          expect(await token.balanceOf(whitelist.address)).to.equal(0);

          expect(await getBalance(whitelist)).to.equal(0);
          expect(await getBalance(controller)).to.equal(
            controllerBalance.add(whitelistBalance).sub(txCost),
          );
        });
      });
    });
  });
});
