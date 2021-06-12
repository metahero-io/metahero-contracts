import { ethers, waffle } from 'hardhat';
import { expect } from 'chai';
import { BigNumber } from 'ethers';
import HEROTokenEconomyMockArtifact from '../artifacts/HEROTokenEconomyMock.json';
import HEROWhitelistArtifact from '../artifacts/HEROWhitelist.json';
import { HEROTokenEconomyMock, HEROWhitelist } from '../typings';
import {
  Signer,
  setNextBlockTimestamp,
  getBalance,
  calcTxCost,
  randomAddress,
} from './common';

const { deployContract } = waffle;
const { getSigners } = ethers;

describe('HEROWhitelist', () => {
  const CLAIM_UNIT_PRICE = BigNumber.from(1000);
  const CLAIM_UNIT_TOKENS = BigNumber.from(10);
  const DEADLINE_BASE = Math.floor(Date.now() / 1000) + 1000;
  const DEADLINE_IN = 60; // 60 sec

  let token: HEROTokenEconomyMock;
  let whitelist: HEROWhitelist;
  let controller: Signer;
  let external: Signer;
  let accounts: Signer[];
  let unclaimedTokens: BigNumber;

  const createBeforeHook = (initialize = true) => {
    before(async () => {
      [controller, external, ...accounts] = await getSigners();

      token = (await deployContract(
        controller,
        HEROTokenEconomyMockArtifact,
      )) as HEROTokenEconomyMock;

      whitelist = (await deployContract(
        controller,
        HEROWhitelistArtifact,
      )) as HEROWhitelist;

      unclaimedTokens = BigNumber.from(accounts.length).mul(CLAIM_UNIT_TOKENS);

      const fee = {
        sender: 0,
        recipient: 0,
      };

      await token.initialize(
        fee, //
        fee,
        0,
        [
          whitelist.address, //
          ...accounts.map(({ address }) => address),
        ],
      );

      await token.transfer(whitelist.address, unclaimedTokens);

      if (initialize) {
        await setNextBlockTimestamp(DEADLINE_BASE);

        await whitelist.initialize(
          token.address,
          DEADLINE_IN,
          CLAIM_UNIT_PRICE,
          CLAIM_UNIT_TOKENS,
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
          CLAIM_UNIT_PRICE,
          CLAIM_UNIT_TOKENS,
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
            CLAIM_UNIT_PRICE,
            CLAIM_UNIT_TOKENS,
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

        expect(output).to.equal(DEADLINE_BASE + DEADLINE_IN);
      });
    });

    context('claimUnitPrice()', () => {
      it('expect to return correct claim unit price', async () => {
        const output = await whitelist.claimUnitPrice();

        expect(output).to.equal(CLAIM_UNIT_PRICE);
      });
    });

    context('claimUnitTokens()', () => {
      it('expect to return correct claim unit tokens', async () => {
        const output = await whitelist.claimUnitTokens();

        expect(output).to.equal(CLAIM_UNIT_TOKENS);
      });
    });

    context('unclaimedAccounts()', () => {
      it('expect to return correct unclaimed accounts', async () => {
        const output = await whitelist.unclaimedAccounts();

        expect(output).to.equal(accounts.length);
      });
    });

    context('claimUnitTokens()', () => {
      it('expect to return correct unclaimed tokens', async () => {
        const output = await whitelist.unclaimedTokens();

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
        const accountsTokens = CLAIM_UNIT_TOKENS.mul(accounts.length);
        await token.transfer(whitelist.address, accountsTokens);
      });

      it('expect to add accounts to whitelist', async () => {
        await whitelist.addAccounts(ACCOUNTS);
      });
    });

    context('# before deadline', () => {
      context('claimTokens()', () => {
        let account: Signer;

        before(() => {
          account = accounts.pop();
        });

        it('expect to revert when sender is not on the whitelist', async () => {
          await expect(
            whitelist.connect(external).claimTokens(),
          ).to.be.revertedWith(
            'HEROWhitelist: msg.sender not on the whitelist',
          );
        });

        it('expect to revert when sender is not on the whitelist', async () => {
          await expect(
            whitelist.connect(external).claimTokens(),
          ).to.be.revertedWith(
            'HEROWhitelist: msg.sender not on the whitelist',
          );
        });

        it('expect to revert on invalid msg.value', async () => {
          await expect(
            whitelist.connect(account).claimTokens(),
          ).to.be.revertedWith('HEROWhitelist: invalid msg.value');
        });

        it('expect to claim tokens', async () => {
          expect(await whitelist.whitelist(account.address)).to.be.true;

          const tx = await whitelist.connect(account).claimTokens({
            value: CLAIM_UNIT_PRICE,
          });

          expect(tx)
            .to.emit(whitelist, 'TokensClaimed')
            .withArgs(account.address);

          expect(await token.balanceOf(account.address)).to.be.equal(
            CLAIM_UNIT_TOKENS,
          );

          expect(await whitelist.whitelist(account.address)).to.be.false;
        });
      });

      context('destroy()', () => {
        it('expect to revert before deadline', async () => {
          await expect(whitelist.destroy()).to.be.revertedWith(
            'HEROWhitelist: can not destroy before deadline',
          );
        });
      });
    });

    context('# after deadline', () => {
      before(async () => {
        await setNextBlockTimestamp(DEADLINE_BASE + DEADLINE_IN);
      });

      context('claimTokens()', () => {
        it('expect to revert before deadline', async () => {
          const claimer = accounts.pop();

          await expect(
            whitelist.connect(claimer).claimTokens(),
          ).to.be.revertedWith(
            'HEROWhitelist: can not claim tokens after deadline',
          );
        });
      });

      context('destroy()', async () => {
        it('expect to destroy the whitelist', async () => {
          const summaryBefore = await token.summary();
          const controllerBalance = await getBalance(controller);
          const whitelistBalance = await getBalance(whitelist);
          const whitelistTokens = await token.balanceOf(whitelist.address);

          const tx = whitelist.destroy();
          const txCost = await calcTxCost(await tx);

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
