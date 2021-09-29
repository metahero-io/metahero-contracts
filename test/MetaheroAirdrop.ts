import { ethers, waffle } from 'hardhat';
import { expect } from 'chai';
import { constants } from 'ethers';
import ERC20MockArtifact from '../artifacts/ERC20Mock.json';
import MetaheroAirdropArtifact from '../artifacts/MetaheroAirdrop.json';
import { MetaheroAirdrop, ERC20Mock } from '../typings';
import { Signer, randomAddress } from './helpers';

const { deployContract } = waffle;
const { getSigners } = ethers;

describe('MetaheroAirdrop', () => {
  let signers: Signer[];
  let owner: Signer;
  let token: ERC20Mock;
  let airdrop: MetaheroAirdrop;

  before(async () => {
    [owner, ...signers] = await getSigners();
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
      token = (await deployContract(owner, ERC20MockArtifact)) as ERC20Mock;

      airdrop = (await deployContract(
        owner,
        MetaheroAirdropArtifact,
      )) as MetaheroAirdrop;

      if (initialize) {
        await airdrop.initialize(token.address);
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

    it('expect to revert when sender is not the initializer', async () => {
      const signer = signers.pop();
      await expect(
        airdrop.connect(signer).initialize(randomAddress()),
      ).to.be.revertedWith('Initializable#2');
    });

    it('expect to revert when token is the zero address', async () => {
      await expect(
        airdrop.initialize(constants.AddressZero),
      ).to.be.revertedWith('MetaheroAirdrop#1');
    });

    it('expect to initialize the contract', async () => {
      const tx = await airdrop.initialize(token.address);

      expect(tx).to.emit(airdrop, 'Initialized').withArgs(token.address);
    });
  });

  context('batchTransfer()', () => {
    createBeforeHook({
      postBefore: async () => {
        //
      },
    });

    it('expect to revert when sender is not the owner', async () => {
      const signer = signers.pop();
      await expect(
        airdrop.connect(signer).batchTransfer([], []),
      ).to.be.revertedWith('Owned#1');
    });

    it('expect to revert on empty recipients list', async () => {
      await expect(airdrop.batchTransfer([], [])).to.be.revertedWith(
        'MetaheroAirdrop#1',
      );
    });

    it('expect to revert on invalid amounts list', async () => {
      await expect(
        airdrop.batchTransfer([randomAddress()], []),
      ).to.be.revertedWith('MetaheroAirdrop#2');
    });

    it('expect to skip empty values', async () => {
      const tx = await airdrop.batchTransfer(
        [randomAddress(), constants.AddressZero],
        [0, 1],
      );
      expect(tx).to.not.emit(token, 'Transfer');
    });

    it('expect to batch transfer', async () => {
      const recipients = [randomAddress(), randomAddress()];
      const amounts = [1000, 200];

      await token.setBalance(airdrop.address, amounts[0] + amounts[1]);

      const tx = await airdrop.batchTransfer(recipients, amounts);

      expect(tx)
        .to.emit(token, 'Transfer')
        .withArgs(airdrop.address, recipients[0], amounts[0]);
      expect(tx)
        .to.emit(token, 'Transfer')
        .withArgs(airdrop.address, recipients[1], amounts[1]);
    });
  });
});
