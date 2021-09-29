import {
  BigNumber,
  BigNumberish,
  ContractReceipt,
  ContractTransaction,
  utils,
} from 'ethers';

export enum LoggerLevels {
  Log,
  Error,
  None,
}

export class Logger {
  constructor(public readonly level: LoggerLevels = LoggerLevels.Log) {
    //
  }

  log(label?: string, data?: any, postfix?: string): void {
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

    if (this.level === LoggerLevels.Log) {
      console.log(...args);
    }
  }

  logPercents(data: BigNumberish): void;
  logPercents(label: string, data: BigNumberish): void;
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
  }

  async logTx(
    label: string,
    txP: Promise<ContractTransaction>,
    onHash?: (hash: string) => Promise<void>,
  ): Promise<{
    tx: ContractTransaction;
    receipt: ContractReceipt;
    cost: BigNumber;
  }> {
    this.info(`sending ${label} ...`);

    const tx = await txP;

    const { hash, gasPrice } = tx;

    this.log('hash', hash);

    if (onHash) {
      await onHash(hash);
    }

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
  }

  error(...args: any[]): any {
    if (this.level <= LoggerLevels.Error) {
      console.error('[ERROR]', ...args);
    }
  }

  info(...args: any[]): void {
    if (this.level === LoggerLevels.Log) {
      console.info('[INFO]', ...args);
    }
  }

  br(): void {
    if (this.level === LoggerLevels.Log) {
      console.log();
    }
  }
}
