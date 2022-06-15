import { ethers, helpers } from 'hardhat';
import { expect } from 'chai';
import { BigNumber, BigNumberish, constants } from 'ethers';
import { ERC20Mock, MetaheroToken, MetaheroSwapHelper } from '../typechain';
import { randomAddress, Signer } from './helpers';

const { getSigners } = ethers;

const { deployContract } = helpers;

describe('MetaheroSwapHelper', () => {
  const ZERO_FEE = {
    sender: 0,
    recipient: 0,
  };
  const REWARDS_FEE = {
    sender: 5,
    recipient: 5,
  };

  let swapHelper: MetaheroSwapHelper;
  let token: MetaheroToken;
  let tokenA: ERC20Mock;
  let tokenB: ERC20Mock;
  let tokenInvalid: string;
  let signers: Signer[];

  before(async () => {
    [, ...signers] = await getSigners();

    ({ address: tokenInvalid } = await deployContract('MetaheroDAO'));
  });

  const createBeforeHook = (
    options: {
      initialize?: boolean;
      postBefore?: () => Promise<void>;
    } = {},
  ) => {
    const { initialize, postBefore } = {
      initialize: true,
      ...options,
    };
    before(async () => {
      token = await deployContract('MetaheroToken');

      swapHelper = await deployContract('MetaheroSwapHelper');

      if (initialize) {
        tokenA = await deployContract('ERC20Mock');

        tokenB = await deployContract('ERC20Mock');

        await token.initialize(
          ZERO_FEE,
          ZERO_FEE,
          REWARDS_FEE,
          constants.MaxUint256,
          constants.AddressZero,
          constants.AddressZero,
          constants.MaxUint256,
          [],
        );

        await swapHelper.initialize(token.address);

        await token.setPresaleAsFinished();
      }

      if (postBefore) {
        await postBefore();
      }
    });
  };

  context('initialize()', () => {
    createBeforeHook({
      initialize: false,
    });

    it('expect to revert on zero token', async () => {
      await expect(
        swapHelper.initialize(constants.AddressZero),
      ).to.be.revertedWith('MetaheroSwapHelper#1');
    });

    it('expect to initialize the contract', async () => {
      expect(await swapHelper.token()).to.equal(constants.AddressZero);

      const tx = await swapHelper.initialize(token.address);

      expect(tx).to.emit(swapHelper, 'Initialized').withArgs(token.address);

      expect(await swapHelper.token()).to.equal(token.address);
    });
  });

  context('getAllowances()', () => {
    const spender = randomAddress();
    const expectedAllowances = {
      token: 1000000,
      tokenA: 2000,
      tokenB: 4000,
    };
    let account: Signer;

    createBeforeHook({
      postBefore: async () => {
        account = signers.pop();

        await token.connect(account).approve(spender, expectedAllowances.token);
        await tokenA
          .connect(account)
          .approve(spender, expectedAllowances.tokenA);
        await tokenB
          .connect(account)
          .approve(spender, expectedAllowances.tokenB);
      },
    });

    it('expect to return zero for not erc20 token', async () => {
      const output = await swapHelper.getAllowances(
        account.address,
        [tokenInvalid],
        [randomAddress()],
      );

      expect(output[0]).to.equal(0);
    });

    it('expect to return zero for not contract', async () => {
      const output = await swapHelper.getAllowances(
        account.address,
        [randomAddress()],
        [randomAddress()],
      );

      expect(output[0]).to.equal(0);
    });

    it('expect to return empty result for no tokens', async () => {
      const output = await swapHelper.getAllowances(account.address, [], []);

      expect(output).to.empty;
    });

    it('expect to return empty result on invalid spenders and tokens arrays length', async () => {
      const output = await swapHelper.getAllowances(
        account.address,
        [randomAddress()],
        [],
      );

      expect(output).to.empty;
    });

    it('expect to return correct allowances', async () => {
      const result = await swapHelper.getAllowances(
        account.address,
        [token.address, tokenA.address, tokenB.address],
        [spender, spender, spender],
      );

      expect(result[0]).to.equal(expectedAllowances.token);
      expect(result[1]).to.equal(expectedAllowances.tokenA);
      expect(result[2]).to.equal(expectedAllowances.tokenB);
    });
  });

  context('getBalances()', () => {
    let account: Signer;
    let expectedBalances: {
      nativeBalance?: BigNumber;
      tokenHoldingBalance?: BigNumber;
      tokenTotalRewards?: BigNumber;
      tokenA: BigNumberish;
      tokenB: BigNumberish;
    } = {
      tokenA: 2000,
      tokenB: 4000,
    };

    createBeforeHook({
      postBefore: async () => {
        account = signers.pop();

        await token.transfer(account.address, 10000000);

        await token.connect(account).transfer(randomAddress(), 10000);

        await tokenA.setBalance(account.address, expectedBalances.tokenA);

        await tokenB.setBalance(account.address, expectedBalances.tokenB);

        const {
          totalRewards: tokenTotalRewards,
          holdingBalance: tokenHoldingBalance,
        } = await token.getBalanceSummary(account.address);

        expectedBalances = {
          ...expectedBalances,
          nativeBalance: await account.getBalance(),
          tokenTotalRewards,
          tokenHoldingBalance,
        };
      },
    });

    it('expect to return zero for not erc20 token', async () => {
      const { tokensBalances } = await swapHelper.getBalances(account.address, [
        tokenInvalid,
      ]);

      expect(tokensBalances[0]).to.equal(0);
    });

    it('expect to return zero for not contract', async () => {
      const { tokensBalances } = await swapHelper.getBalances(account.address, [
        randomAddress(),
      ]);

      expect(tokensBalances[0]).to.equal(0);
    });

    it('expect to return empty tokens balances for no tokens in call', async () => {
      const { tokensBalances } = await swapHelper.getBalances(
        account.address,
        [],
      );

      expect(tokensBalances).to.empty;
    });

    it('expect to return correct balances', async () => {
      const {
        nativeBalance,
        tokenHoldingBalance,
        tokenTotalRewards,
        tokensBalances,
      } = await swapHelper.getBalances(account.address, [
        tokenA.address,
        tokenB.address,
      ]);

      expect(nativeBalance).to.equal(expectedBalances.nativeBalance);
      expect(tokenHoldingBalance).to.equal(
        expectedBalances.tokenHoldingBalance,
      );
      expect(tokenTotalRewards).to.equal(expectedBalances.tokenTotalRewards);
      expect(tokensBalances[0]).to.equal(expectedBalances.tokenA);
      expect(tokensBalances[1]).to.equal(expectedBalances.tokenB);
    });
  });
});
