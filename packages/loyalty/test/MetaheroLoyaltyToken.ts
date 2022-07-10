import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { helpers, ethers } from 'hardhat';
import { expect } from 'chai';
import { MetaheroLoyaltyToken, ERC20PresetFixedSupply } from '../typechain';

const {
  constants: { AddressZero },
} = ethers;
const {
  getSigners,
  deployContract,
  processTransaction,
  increaseNextBlockTimestamp,
} = helpers;

describe('MetaheroLoyaltyToken', () => {
  const paymentTokenTotalSupply = 1_000_000;
  const snapshotWindowMinLength = 10;
  const maxTotalSupply = 100;
  const earlyWithdrawalTax = 0;

  let paymentToken: ERC20PresetFixedSupply;
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
  });

  describe('initialize()', () => {
    it('expect to revert when msg.sender is not the deployer', async () => {
      await expect(
        loyaltyToken
          .connect(account)
          .initialize(
            paymentToken.address,
            snapshotWindowMinLength,
            maxTotalSupply,
            earlyWithdrawalTax,
          ),
      ).revertedWith('MsgSenderIsNotTheDeployer()');
    });

    it('expect to revert when payment token is the zero address', async () => {
      await expect(
        loyaltyToken.initialize(
          AddressZero,
          snapshotWindowMinLength,
          maxTotalSupply,
          earlyWithdrawalTax,
        ),
      ).revertedWith('PaymentTokenIsTheZeroAddress()');
    });

    it('expect to initialize the contract', async () => {
      expect(await loyaltyToken.initialized()).to.eq(false);

      const snapshotBaseTimestamp = await increaseNextBlockTimestamp();

      const { tx } = await processTransaction(
        loyaltyToken.initialize(
          paymentToken.address,
          snapshotWindowMinLength,
          maxTotalSupply,
          earlyWithdrawalTax,
        ),
      );

      await expect(tx)
        .to.emit(loyaltyToken, 'Initialized')
        .withArgs(
          paymentToken.address,
          snapshotBaseTimestamp,
          snapshotWindowMinLength,
          maxTotalSupply,
          earlyWithdrawalTax,
        );

      expect(await loyaltyToken.initialized()).to.eq(true);
    });

    it('expect to revert when contract is initialized', async () => {
      await expect(
        loyaltyToken
          .connect(account)
          .initialize(
            paymentToken.address,
            snapshotWindowMinLength,
            maxTotalSupply,
            earlyWithdrawalTax,
          ),
      ).revertedWith('AlreadyInitialized()');
    });
  });
});
