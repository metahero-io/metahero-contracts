import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { helpers, ethers } from 'hardhat';
import { expect } from 'chai';
import { ERC20Helper, ERC20PresetFixedSupply } from '../typechain';

const {
  constants: { AddressZero },
} = ethers;

const { deployContract, getSigners, processTransaction, randomAddress } =
  helpers;

describe('ERC20Helper', () => {
  const totalSupply = 1_000_000;
  const tokenABalance = 1000;
  const tokenBBalance = 2000;
  const tokenAAllowance = 100;
  const tokenBAllowance = 120;
  const spender = randomAddress();

  let tokenA: ERC20PresetFixedSupply;
  let tokenB: ERC20PresetFixedSupply;
  let tokens: string[];
  let helper: ERC20Helper;
  let deployer: SignerWithAddress;
  let account: SignerWithAddress;

  before(async () => {
    [deployer, account] = await getSigners();

    tokenA = await deployContract(
      'ERC20PresetFixedSupply',
      '',
      '',
      totalSupply,
      deployer.address,
    );

    tokenB = await deployContract(
      'ERC20PresetFixedSupply',
      '',
      '',
      totalSupply,
      deployer.address,
    );

    helper = await deployContract('ERC20Helper');

    await processTransaction(tokenA.transfer(account.address, tokenABalance));

    await processTransaction(
      tokenA.connect(account).approve(spender, tokenAAllowance),
    );

    await processTransaction(tokenB.transfer(account.address, tokenBBalance));

    await processTransaction(
      tokenB.connect(account).approve(spender, tokenBAllowance),
    );

    tokens = [tokenA.address, tokenB.address];
  });

  describe('# external functions (views)', () => {
    before(async () => {});

    describe('getAllowances()', () => {
      it('expect to return 0 for non-tokens', async () => {
        const output = await helper.getAllowances(
          [randomAddress(), helper.address, ...tokens],
          account.address,
          spender,
        );

        expect(output[0]).to.eq(0);
        expect(output[1]).to.eq(0);
        expect(output[2]).to.eq(tokenAAllowance);
        expect(output[3]).to.eq(tokenBAllowance);
      });

      it('expect to return allowances', async () => {
        const output = await helper.getAllowances(
          tokens,
          account.address,
          spender,
        );

        expect(output[0]).to.eq(tokenAAllowance);
        expect(output[1]).to.eq(tokenBAllowance);
      });
    });

    describe('getBalances()', () => {
      it('expect to return 0 for non-tokens', async () => {
        const output = await helper.getBalances(
          [randomAddress(), helper.address, ...tokens],
          account.address,
        );

        expect(output[0]).to.eq(0);
        expect(output[1]).to.eq(0);
        expect(output[2]).to.eq(tokenABalance);
        expect(output[3]).to.eq(tokenBBalance);
      });

      it('expect to return balances', async () => {
        const output = await helper.getBalances(
          [...tokens, AddressZero],
          account.address,
        );

        expect(output[0]).to.eq(tokenABalance);
        expect(output[1]).to.eq(tokenBBalance);
        expect(output[2]).to.eq(await account.getBalance());
      });
    });
  });
});
