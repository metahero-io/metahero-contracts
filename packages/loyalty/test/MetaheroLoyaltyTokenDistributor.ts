import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { helpers, ethers } from 'hardhat';
import { expect } from 'chai';
import {
  MetaheroLoyaltyTokenDistributor,
  MetaheroLoyaltyToken,
  ERC20PresetFixedSupply,
} from '../typechain';

const {
  constants: { AddressZero },
} = ethers;

const {
  deployContract,
  getSigners,
  processTransaction,
  randomAddress,
  resetSnapshots,
  revertSnapshot,
} = helpers;

describe('MetaheroLoyaltyTokenDistributor', () => {
  const paymentTokenTotalSupply = 1_000_000;
  const snapshotWindowMinLength = 10;
  const earlyWithdrawalTax = 5_000;

  let paymentToken: ERC20PresetFixedSupply;
  let tokenDistributor: MetaheroLoyaltyTokenDistributor;
  let loyaltyToken: MetaheroLoyaltyToken;
  let deployer: SignerWithAddress;
  let account: SignerWithAddress;

  before(async () => {
    [deployer, account] = await getSigners();

    paymentToken = await deployContract(
      'ERC20PresetFixedSupply',
      '',
      '',
      paymentTokenTotalSupply,
      deployer.address,
    );

    loyaltyToken = await deployContract('MetaheroLoyaltyToken');

    tokenDistributor = await deployContract('MetaheroLoyaltyTokenDistributor');
  });

  const createBeforeHook = (
    options: {
      initialize?: boolean;
    } = {},
  ) => {
    options = {
      initialize: true,
      ...options,
    };

    before(async () => {
      await revertSnapshot();

      await processTransaction(
        loyaltyToken.initialize(
          paymentToken.address,
          randomAddress(),
          tokenDistributor.address,
          snapshotWindowMinLength,
          earlyWithdrawalTax,
        ),
      );

      if (options.initialize) {
        await processTransaction(
          tokenDistributor.initialize(
            loyaltyToken.address,
            paymentToken.address,
          ),
        );
      }
    });
  };

  after(() => {
    resetSnapshots();
  });

  describe('initialize()', () => {
    createBeforeHook({
      initialize: false,
    });

    it('expect to revert when msg.sender is not the deployer', async () => {
      await expect(
        tokenDistributor
          .connect(account)
          .initialize(randomAddress(), randomAddress()),
      ).revertedWith('MsgSenderIsNotTheDeployer()');
    });

    it('expect to revert when loyalty token is the zero address', async () => {
      await expect(
        tokenDistributor.initialize(AddressZero, randomAddress()),
      ).revertedWith('LoyaltyTokenIsTheZeroAddress()');
    });

    it('expect to revert when payment token is the zero address', async () => {
      await expect(
        tokenDistributor.initialize(randomAddress(), AddressZero),
      ).revertedWith('PaymentTokenIsTheZeroAddress()');
    });

    it('expect to initialize the contract', async () => {
      expect(await tokenDistributor.initialized()).to.eq(false);

      const { tx } = await processTransaction(
        tokenDistributor.initialize(loyaltyToken.address, paymentToken.address),
      );

      await expect(tx)
        .to.emit(tokenDistributor, 'Initialized')
        .withArgs(loyaltyToken.address, paymentToken.address);

      expect(await tokenDistributor.initialized()).to.eq(true);
    });

    it('expect to revert when contract is initialized', async () => {
      await expect(
        tokenDistributor.initialize(loyaltyToken.address, paymentToken.address),
      ).revertedWith('AlreadyInitialized()');
    });
  });
});
