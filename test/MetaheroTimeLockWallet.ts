import { ethers, waffle } from 'hardhat';
import { expect } from 'chai';
import ERC20MockArtifact from '../artifacts/ERC20Mock.json';
import MetaheroTimeLockWalletArtifact from '../artifacts/MetaheroTimeLockWallet.json';
import { ERC20Mock, MetaheroTimeLockWallet } from '../typings';
import { Signer, randomAddress } from './helpers';

const { deployContract } = waffle;
const { getSigners } = ethers;

describe('MetaheroTimeLockWallet', () => {
  let token: ERC20Mock;
  let wallet: MetaheroTimeLockWallet;
  let registry: Signer;
  let signers: Signer[];

  before(async () => {
    [registry, ...signers] = await getSigners();

    token = (await deployContract(registry, ERC20MockArtifact)) as ERC20Mock;

    wallet = (await deployContract(registry, MetaheroTimeLockWalletArtifact, [
      token.address,
    ])) as MetaheroTimeLockWallet;
  });

  context('token()', () => {
    it('expect to return correct token address', async () => {
      expect(await wallet.token()).to.equal(token.address);
    });
  });

  context('registry()', () => {
    it('expect to return correct registry address', async () => {
      expect(await wallet.registry()).to.equal(registry.address);
    });
  });

  context('transferTokens()', () => {
    it('expect to revert when sender is not the registry', async () => {
      const signer = signers.pop();

      await expect(
        wallet.connect(signer).transferTokens(randomAddress(), 1),
      ).to.be.revertedWith('');
    });

    it('expect to revert on transfer failed', async () => {
      await expect(
        wallet.connect(registry).transferTokens(randomAddress(), 1),
      ).to.be.revertedWith('');
    });

    it('expect to transfer tokens', async () => {
      const recipient = randomAddress();
      const amount = 100;

      await token.setBalance(wallet.address, amount);

      await wallet.connect(registry).transferTokens(recipient, amount);

      expect(await token.balanceOf(wallet.address)).to.equal(0);
      expect(await token.balanceOf(recipient)).to.equal(amount);
    });
  });
});
