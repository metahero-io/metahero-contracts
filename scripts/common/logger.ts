import {
  BigNumber,
  BigNumberish,
  ContractReceipt,
  ContractTransaction,
  utils,
} from 'ethers';

export const logger: {
  log(label?: string, data?: any, postfix?: string): void;
  logPercents(data: BigNumberish): void;
  logPercents(label: string, data: BigNumberish): void;
  logTx(
    label: string,
    txP: Promise<ContractTransaction>,
  ): Promise<{
    tx: ContractTransaction;
    receipt: ContractReceipt;
    cost: BigNumber;
  }>;
  error(...args: any[]): void;
  info(...args: any[]): void;
  br(): void;
} = {
  log(label?, data?, postfix?) {
    const args: any[] = ['[LOG]'];

    if (typeof data == 'undefined') {
      if (label) {
        args.push(label);
      }
    } else {
      if (label) {
        args.push(`${label}:`);
      }

      if (BigNumber.isBigNumber(data)) {
        const amount = BigNumber.from(data);

        if (amount.gt(0)) {
          args.push(utils.formatEther(amount), `(${amount.toString()})`);
        } else {
          args.push(0);
        }
      } else {
        args.push(data);
      }
    }

    if (postfix) {
      args.push(postfix);
    }

    console.log(...args);
  },

  logPercents(...args: any[]) {
    let label: string;
    let data: BigNumber;
    switch (args.length) {
      case 1:
        data = BigNumber.from(args[0]);
        break;
      case 2:
        label = args[0];
        data = BigNumber.from(args[1]);
        break;
    }

    this.log(label, `${data.toString()}%`);
  },

  async logTx(label, txP) {
    this.info(`sending ${label} ...`);

    const tx = await txP;

    const { hash, gasPrice } = tx;

    this.log('hash', hash);

    const receipt = await tx.wait();
    const { gasUsed } = receipt;

    const cost = gasPrice.mul(gasUsed);

    this.log('gas', gasUsed.toString());
    this.log('cost', cost, 'BNB');

    return {
      tx,
      receipt,
      cost,
    };
  },

  error(...args: any[]) {
    console.error('[ERROR]', ...args);
  },

  info(...args: any[]) {
    console.info('[INFO]', ...args);
  },

  br() {
    console.log();
  },
};
