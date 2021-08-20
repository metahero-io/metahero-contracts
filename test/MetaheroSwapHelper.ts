import { ethers, waffle } from 'hardhat';
import { expect } from 'chai';
import { BigNumber, BigNumberish, constants } from 'ethers';
import ERC20MockArtifact from '../artifacts/ERC20Mock.json';
import MetaheroDAOArtifact from '../artifacts/MetaheroDAO.json';
import MetaheroTokenArtifact from '../artifacts/MetaheroToken.json';
import MetaheroSwapHelperArtifact from '../artifacts/MetaheroSwapHelper.json';
import { ERC20Mock, MetaheroToken, MetaheroSwapHelper } from '../typings';
import { randomAddress, Signer } from './helpers';

const { deployContract } = waffle;
const { getSigners } = ethers;

describe('MetaheroSwapHelper', () => {
  const ZERO_FEE = {
    sender: 0,
    recipient: 0,
  };
  const REWARDS_FEE = {
    sender: 5,
    recipient: 5,
  };

  let owner: Signer;
  let swapHelper: MetaheroSwapHelper;
  let token: MetaheroToken;
  let tokenA: ERC20Mock;
  let tokenB: ERC20Mock;
  let tokenInvalid: string;
  let signers: Signer[];

  before(async () => {
    [owner, ...signers] = await getSigners();

    ({ address: tokenInvalid } = await deployContract(
      owner,
      MetaheroDAOArtifact,
    ));
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
      token = (await deployContract(
        owner,
        MetaheroTokenArtifact,
      )) as MetaheroToken;

      swapHelper = (await deployContract(
        owner,
        MetaheroSwapHelperArtifact,
      )) as MetaheroSwapHelper;

      if (initialize) {
        tokenA = (await deployContract(owner, ERC20MockArtifact)) as ERC20Mock;

        tokenB = (await deployContract(owner, ERC20MockArtifact)) as ERC20Mock;

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

  context('getAccountBalances()', () => {
    let account: Signer;
    let expectedBalances: {
      nativeBalance?: BigNumber;
      holdingBalance?: BigNumber;
      totalRewards?: BigNumber;
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

        const { totalRewards, holdingBalance } = await token.getBalanceSummary(
          account.address,
        );

        expectedBalances = {
          ...expectedBalances,
          nativeBalance: await account.getBalance(),
          totalRewards,
          holdingBalance,
        };
      },
    });

    it('expect to return zero for not erc20 token', async () => {
      const { tokensBalances } = await swapHelper.getAccountBalances(
        account.address,
        [tokenInvalid],
      );

      expect(tokensBalances[0]).to.equal(0);
    });

    it('expect to return zero for not contract', async () => {
      const { tokensBalances } = await swapHelper.getAccountBalances(
        account.address,
        [randomAddress()],
      );

      expect(tokensBalances[0]).to.equal(0);
    });

    it('expect to return empty tokens balances for no tokens in call', async () => {
      const { tokensBalances } = await swapHelper.getAccountBalances(
        account.address,
        [],
      );

      expect(tokensBalances).to.empty;
    });

    it('expect to return correct balances', async () => {
      const { nativeBalance, holdingBalance, totalRewards, tokensBalances } =
        await swapHelper.getAccountBalances(account.address, [
          tokenA.address,
          tokenB.address,
        ]);

      expect(nativeBalance).to.equal(expectedBalances.nativeBalance);
      expect(holdingBalance).to.equal(expectedBalances.holdingBalance);
      expect(totalRewards).to.equal(expectedBalances.totalRewards);
      expect(tokensBalances[0]).to.equal(expectedBalances.tokenA);
      expect(tokensBalances[1]).to.equal(expectedBalances.tokenB);
    });
  });
});
