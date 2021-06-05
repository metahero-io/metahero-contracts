import { ethers, waffle } from 'hardhat';
import { BigNumber, BigNumberish, ContractTransaction } from 'ethers';
import HEROTokenArtifact from '../../artifacts/HEROToken.json';
import { HEROToken } from '../../typings';
import { Signer, HEROTokenHelperConfig } from './interfaces';

const { deployContract } = waffle;
const { getSigners } = ethers;

interface HEROTokenAccount {
  cycleId: number;
  type: 'holder' | 'excluded';
  signer: Signer;
  balance: BigNumber;
}

interface HEROTokenSummary {
  cycleId: number;
  totalLp: BigNumber;
  totalRewards: BigNumber;
  totalSupply: BigNumber;
}

interface HEROTokenTransferFees {
  total: BigNumber;
  lp: BigNumber;
  rewards: BigNumber;
}

export class HEROTokenHelper {
  static async getInstance(
    config: HEROTokenHelperConfig,
  ): Promise<HEROTokenHelper> {
    const signers = await getSigners();

    return new HEROTokenHelper(config, signers);
  }

  private accounts: HEROTokenAccount[];
  private firstCycleTimestamp: number;
  private summary: HEROTokenSummary;
  private token: HEROToken;

  protected constructor(
    private readonly config: HEROTokenHelperConfig, //
    private readonly signers: Signer[],
  ) {
    //
  }

  async deploy(): Promise<HEROToken> {
    this.token = (await deployContract(
      this.signers[0],
      HEROTokenArtifact,
    )) as HEROToken;

    return this.token;
  }

  async initialize(): Promise<ContractTransaction> {
    this.accounts = [];

    const {
      lpFees, //
      rewardsFees,
      cycleLength,
      cycleWeightGain,
      totalSupply: totalSupplyRaw,
      excludedAccounts,
    } = this.config;

    const totalSupply = BigNumber.from(totalSupplyRaw);
    const excludedAccountsAddresses: string[] = [];

    for (let index = 0; index <= this.signers.length; index += 1) {
      const signer = this.signers[index];
      const defaults: Pick<HEROTokenAccount, 'cycleId' | 'signer'> = {
        cycleId: 0,
        signer,
      };

      if (index < excludedAccounts) {
        let balance = BigNumber.from(0);

        if (index === 0) {
          balance = totalSupply;
        } else {
          excludedAccountsAddresses.push(signer.address);
        }

        this.accounts.push({
          ...defaults,
          type: 'excluded',
          balance,
        });
      } else {
        this.accounts.push({
          ...defaults,
          type: 'holder',
          balance: BigNumber.from(0),
        });
      }
    }

    const result = await this.token.initialize(
      lpFees,
      rewardsFees,
      cycleLength,
      cycleWeightGain,
      totalSupply,
      excludedAccountsAddresses,
    );

    this.firstCycleTimestamp = (
      await this.token.firstCycleTimestamp()
    ).toNumber();

    this.summary = {
      cycleId: 0,
      totalLp: BigNumber.from(0),
      totalRewards: BigNumber.from(0),
      totalSupply,
    };

    return result;
  }

  async transfer(
    senderType: HEROTokenAccount['type'],
    senderIndex: number,
    recipientType: HEROTokenAccount['type'],
    recipientIndex: number,
    amount: BigNumberish,
  ): Promise<ContractTransaction> {
    const sender = this.findAccount(senderType, senderIndex);
    const recipient = this.findAccount(recipientType, recipientIndex);

    const amountBN = BigNumber.from(amount);

    const result = await this.token
      .connect(sender.signer)
      .transfer(recipient.signer.address, amountBN);

    await this.updateCycle();

    let lpFee = BigNumber.from(0);
    let rewardsFee = BigNumber.from(0);

    let senderBalance = sender.balance.sub(amountBN);
    let recipientBalance = recipient.balance.add(amountBN);

    if (recipientType === 'holder') {
      const recipientFees = this.calcFees(amountBN, 'recipient');

      lpFee = lpFee.add(recipientFees.lp);
      rewardsFee = lpFee.add(recipientFees.rewards);

      recipientBalance = recipientBalance.sub(recipientFees.total);
    }

    sender.balance = senderBalance;
    recipient.balance = recipientBalance;

    this.summary.totalLp = this.summary.totalLp.add(lpFee);
    this.summary.totalRewards = this.summary.totalRewards.add(rewardsFee);

    sender.cycleId = this.summary.cycleId;

    if (!recipient.cycleId) {
      recipient.cycleId = this.summary.cycleId;
    }

    return result;
  }

  private async updateCycle(): Promise<void> {
    const { provider } = this.token;
    const { timestamp } = await provider.getBlock('latest');

    if (timestamp > this.firstCycleTimestamp) {
      const { cycleLength } = this.config;

      const diff = timestamp - this.firstCycleTimestamp;

      this.summary.cycleId = Math.floor(diff / cycleLength);
    }
  }

  private calcFees(
    amount: BigNumber,
    type: 'sender' | 'recipient',
  ): HEROTokenTransferFees {
    const { lpFees, rewardsFees } = this.config;

    const lp = amount.mul(lpFees[type]).div(100);
    const rewards = amount.mul(rewardsFees[type]).div(100);
    const total = lp.add(rewards);

    return {
      lp,
      rewards,
      total,
    };
  }

  private getAccountReward(account: HEROTokenAccount): BigNumber {
    let result = BigNumber.from(0);

    const { type } = account;
    const { totalRewards } = this.summary;

    if (type === 'holder' && totalRewards.gt(0)) {
      const accountWeight = this.getAccountWeight(account);

      if (accountWeight.gt(0)) {
        const accountsWeight = this.getAccountsWeight();

        result = totalRewards.mul(accountWeight).div(accountsWeight);
      }
    }

    return result;
  }

  private getAccountWeight(account: HEROTokenAccount): BigNumber {
    let result = BigNumber.from(0);

    if (account.balance.gt(0)) {
      result = account.balance;

      const { cycleWeightGain } = this.config;
      const { cycleId } = this.summary;

      const cycles = cycleId - account.cycleId;

      if (cycles) {
        result = result.add(result.mul(cycles).mul(cycleWeightGain).div(100));
      }
    }

    return result;
  }

  private getAccountsWeight(): BigNumber {
    let result = BigNumber.from(0);

    const { excludedAccounts } = this.config;

    for (
      let index = excludedAccounts;
      index < this.accounts.length;
      index += 1
    ) {
      result = result.add(this.getAccountWeight(this.accounts[index]));
    }

    return result;
  }

  private findAccount(
    type: HEROTokenAccount['type'],
    index = 0,
  ): HEROTokenAccount {
    if (type === 'holder') {
      const { excludedAccounts } = this.config;
      index += excludedAccounts;
    }

    if (index >= this.accounts.length) {
      throw new Error('Invalid account index');
    }

    return this.accounts[index];
  }
}
