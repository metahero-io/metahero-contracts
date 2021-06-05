import { ethers, waffle } from 'hardhat';
import { BigNumber, BigNumberish, ContractTransaction } from 'ethers';
import HEROTokenArtifact from '../../artifacts/HEROToken.json';
import { HEROToken } from '../../typings';
import { Signer, HEROTokenHelperConfig } from './interfaces';

const { deployContract } = waffle;
const { getSigners } = ethers;

interface HEROTokenAccount {
  type: 'holder' | 'excluded';
  signer: Signer;
  balance: BigNumber;
}

export class HEROTokenHelper {
  static async getInstance(
    config: HEROTokenHelperConfig,
  ): Promise<HEROTokenHelper> {
    const signers = await getSigners();

    return new HEROTokenHelper(config, signers);
  }

  private token: HEROToken;
  private accounts: HEROTokenAccount[];

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
      totalSupply,
      excludedAccounts,
    } = this.config;

    const excludedAccountsAddresses: string[] = [];

    for (let index = 0; index <= this.signers.length; index += 1) {
      const signer = this.signers[index];

      if (index < excludedAccounts) {
        let balance = BigNumber.from(0);

        if (index === 0) {
          balance = BigNumber.from(totalSupply);
        } else {
          excludedAccountsAddresses.push(signer.address);
        }

        this.accounts.push({
          signer,
          type: 'excluded',
          balance,
        });
      } else {
        this.accounts.push({
          signer,
          type: 'holder',
          balance: BigNumber.from(0),
        });
      }
    }

    return this.token.initialize(
      lpFees,
      rewardsFees,
      cycleLength,
      cycleWeightGain,
      totalSupply,
      excludedAccountsAddresses,
    );
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

    return this.token
      .connect(sender.signer)
      .transfer(recipient.signer.address, amountBN);
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
