import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { ethers, helpers } from 'hardhat';
import { expect } from 'chai';
import { ERC20Mock } from '../../typechain';

const {
  constants: { AddressZero, MaxUint256 },
} = ethers;

const {
  getSigners,
  deployContract,
  processTransaction,
  resetSnapshots,
  revertSnapshot,
  randomAddress,
} = helpers;

describe('ERC20 (using mock)', () => {
  const totalSupply = 1000000;

  let erc20: ERC20Mock;
  let deployer: SignerWithAddress;
  let account: SignerWithAddress;
  let spender: SignerWithAddress;
  let operator: SignerWithAddress;
  let signers: SignerWithAddress[];

  before(async () => {
    [deployer, account, operator, , spender, ...signers] = await getSigners();

    erc20 = await deployContract('ERC20Mock', totalSupply);
  });

  after(() => {
    resetSnapshots();
  });

  describe('# external functions (pure)', () => {
    const data = {
      name: 'ERC20 Mock',
      symbol: 'ERC20-MOCK',
      decimals: 18,
    };

    before(async () => {
      await revertSnapshot();
    });

    describe('name()', () => {
      it('expect to return correct name', async () => {
        expect(await erc20.name()).to.eq(data.name);
      });
    });

    describe('symbol()', () => {
      it('expect to return correct symbol', async () => {
        expect(await erc20.symbol()).to.eq(data.symbol);
      });
    });

    describe('decimals()', () => {
      it('expect to return correct decimals', async () => {
        expect(await erc20.decimals()).to.eq(data.decimals);
      });
    });
  });

  describe('# external functions (views)', () => {
    const data = {
      amount: 1000000,
      allowance: 200,
    };

    before(async () => {
      await revertSnapshot();
    });

    before(async () => {
      await processTransaction(erc20.transfer(account.address, data.amount));

      await processTransaction(
        erc20.connect(account).approve(spender.address, data.allowance),
      );
    });

    describe('totalSupply()', () => {
      it('expect to return correct total supply', async () => {
        expect(await erc20.totalSupply()).to.eq(totalSupply);
      });
    });

    describe('balanceOf()', () => {
      it('expect to return correct balance', async () => {
        expect(await erc20.balanceOf(account.address)).to.eq(data.amount);
      });
    });

    describe('allowance()', () => {
      it('expect to return correct allowance', async () => {
        expect(await erc20.allowance(account.address, spender.address)).to.eq(
          data.allowance,
        );
      });
    });
  });

  describe('# external function', () => {
    describe('approve()', () => {
      before(async () => {
        await revertSnapshot();
      });

      it('expect to revert when spender is the zero address', async () => {
        await expect(erc20.approve(AddressZero, 0)).revertedWith(
          'SpenderIsTheZeroAddress()',
        );
      });

      it('expect to approve tokens', async () => {
        const [account] = signers;
        const spender = randomAddress();
        const amount = 100;

        const { tx } = await processTransaction(
          erc20.connect(account).approve(spender, amount),
        );

        await expect(tx)
          .to.emit(erc20, 'Approval')
          .withArgs(account.address, spender, amount);

        expect(await erc20.allowance(account.address, spender)).to.eq(amount);
      });
    });

    describe('transfer()', () => {
      const data = {
        amount: 10000,
      };

      before(async () => {
        await revertSnapshot();

        await processTransaction(erc20.transfer(account.address, data.amount));
      });

      it('expect to revert on transferring to the zero address', async () => {
        await expect(erc20.transfer(AddressZero, 0)).revertedWith(
          'TransferToTheZeroAddress()',
        );
      });

      it('expect to revert when amount is zero', async () => {
        await expect(erc20.transfer(randomAddress(), 0)).revertedWith(
          'AmountIsZero()',
        );
      });

      it('expect to revert when amount exceeds account balance', async () => {
        await expect(
          erc20.connect(account).transfer(randomAddress(), data.amount + 1),
        ).revertedWith('AmountExceedsBalance()');
      });

      it('expect to transfer tokens', async () => {
        const to = randomAddress();

        const { tx } = await processTransaction(
          erc20.connect(account).transfer(to, data.amount),
        );

        await expect(tx)
          .to.emit(erc20, 'Transfer')
          .withArgs(account.address, to, data.amount);

        expect(await erc20.balanceOf(account.address)).to.eq(0);

        expect(await erc20.balanceOf(to)).to.eq(data.amount);
      });
    });

    describe('transferFrom()', () => {
      before(async () => {
        await revertSnapshot();
      });

      const data = {
        balance: 523000,
        allowance: 23000,
      };

      before(async () => {
        await processTransaction(erc20.transfer(account.address, data.balance));

        await processTransaction(
          erc20.connect(account).approve(spender.address, data.allowance),
        );

        await processTransaction(
          erc20.connect(account).approve(operator.address, MaxUint256),
        );
      });

      it('expect to revert when amount exceeds account allowance', async () => {
        await expect(
          erc20
            .connect(spender)
            .transferFrom(account.address, randomAddress(), data.allowance + 1),
        ).revertedWith('InsufficientAllowance()');
      });

      it('expect to transfer tokens from spender', async () => {
        const to = randomAddress();
        const amount = 200;

        const { tx } = await processTransaction(
          erc20.connect(spender).transferFrom(account.address, to, amount),
        );

        data.balance -= amount;

        await expect(tx)
          .to.emit(erc20, 'Transfer')
          .withArgs(account.address, to, amount);

        expect(await erc20.balanceOf(account.address)).to.eq(data.balance);

        expect(await erc20.balanceOf(to)).to.eq(amount);

        expect(await erc20.allowance(account.address, spender.address)).to.eq(
          data.allowance - amount,
        );
      });

      it('expect to transfer tokens from operator', async () => {
        const to = randomAddress();
        const amount = 100;

        const { tx } = await processTransaction(
          erc20.connect(operator).transferFrom(account.address, to, amount),
        );

        data.balance -= amount;

        await expect(tx)
          .to.emit(erc20, 'Transfer')
          .withArgs(account.address, to, amount);

        expect(await erc20.balanceOf(account.address)).to.eq(data.balance);

        expect(await erc20.balanceOf(to)).to.eq(amount);

        expect(await erc20.allowance(account.address, operator.address)).to.eq(
          MaxUint256,
        );
      });
    });
  });

  describe('# internal function', () => {
    describe('_mint()', () => {
      const data = {
        amount: 10000,
      };

      before(async () => {
        await revertSnapshot();
      });

      it('expect to revert on minting to the zero address', async () => {
        await expect(erc20.mint(AddressZero, 0)).revertedWith(
          'MintToTheZeroAddress()',
        );
      });

      it('expect to revert when amount is zero', async () => {
        await expect(erc20.mint(randomAddress(), 0)).revertedWith(
          'AmountIsZero()',
        );
      });

      it('expect to mint tokens', async () => {
        const to = randomAddress();

        const { tx } = await processTransaction(erc20.mint(to, data.amount));

        await expect(tx)
          .to.emit(erc20, 'Transfer')
          .withArgs(AddressZero, to, data.amount);

        expect(await erc20.balanceOf(to)).to.eq(data.amount);
        expect(await erc20.totalSupply()).to.eq(totalSupply + data.amount);
      });
    });

    describe('_burn()', () => {
      const data = {
        from: randomAddress(),
        amount: 10000,
      };

      before(async () => {
        await revertSnapshot();
      });

      it('expect to revert when amount is zero', async () => {
        await expect(erc20.burn(randomAddress(), 0)).revertedWith(
          'AmountIsZero()',
        );
      });

      it('expect to revert when amount exceeds balance', async () => {
        await expect(erc20.burn(randomAddress(), 1)).revertedWith(
          'AmountExceedsBalance()',
        );
      });

      it('expect to burn tokens', async () => {
        const { tx } = await processTransaction(
          erc20.burn(deployer.address, data.amount),
        );

        await expect(tx)
          .to.emit(erc20, 'Transfer')
          .withArgs(deployer.address, AddressZero, data.amount);

        expect(await erc20.balanceOf(deployer.address)).to.eq(
          totalSupply - data.amount,
        );
        expect(await erc20.totalSupply()).to.eq(totalSupply - data.amount);
      });
    });

    describe('_setOperators()', () => {
      before(async () => {
        await revertSnapshot();
      });

      it('expect to set empty list of operators', async () => {
        await processTransaction(erc20.setOperators([]));
      });

      it('expect to set list of operators', async () => {
        const exited = randomAddress();

        await processTransaction(
          erc20.setOperators([randomAddress(), exited, AddressZero]),
        );
      });
    });
  });
});
