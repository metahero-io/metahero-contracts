import { constants } from 'ethers';
import { ethers, helpers } from 'hardhat';
import { expect } from 'chai';
import { MetaheroToken } from '../../typechain';
import { Signer } from '../helpers';

const { getSigners } = ethers;

const { deployContract } = helpers;

describe('MetaheroToken', () => {
  describe('# before initialization', () => {
    const ZERO_FEE = {
      sender: 0,
      recipient: 0,
    };

    let signers: Signer[];
    let token: MetaheroToken;

    before(async () => {
      signers = await getSigners();

      [, ...signers] = signers;

      token = await deployContract('MetaheroToken');
    });

    context('initialize()', () => {
      it('expect to revert when sender is not the initializer', async () => {
        const signer = signers.pop();
        await expect(
          token
            .connect(signer)
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

      it('expect to revert when lpm is the zero address', async () => {
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
        ).to.be.revertedWith('MetaheroToken#3');
      });

      it('expect to revert when the total fee is too high', async () => {
        await expect(
          token.initialize(
            ZERO_FEE,
            ZERO_FEE,
            { sender: 30, recipient: 1 },
            0,
            constants.AddressZero,
            constants.AddressZero,
            0,
            [],
          ),
        ).to.be.revertedWith('MetaheroToken#26');
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
  });
});
