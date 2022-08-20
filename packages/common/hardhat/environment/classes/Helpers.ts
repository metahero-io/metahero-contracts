import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { ContractTransaction, ContractReceipt, Contract, Signer } from 'ethers';
import kleur from 'kleur';
import {
  bindObjectMethods,
  ProcessEnvNames,
  HARDHAT_MNEMONIC,
  HARDHAT_PATH_PREFIX,
  NetworkNames,
} from '../../shared';

export class Helpers {
  private signers: SignerWithAddress[];
  private snapshotIds: string[] = [];
  private addresses = new Map<string, string>();

  constructor(private readonly hre: HardhatRuntimeEnvironment) {
    bindObjectMethods(this);
  }

  isLocalNetwork(): boolean {
    const {
      network: { name },
    } = this.hre;

    return name === NetworkNames.Local || name === NetworkNames.Hardhat;
  }

  async getKnownAddress(name: string): Promise<string> {
    let result = this.addresses.get(name);

    if (!result) {
      const {
        deployments: { get },
      } = this.hre;

      try {
        ({ address: result } = await get(name));
      } catch (err) {
        //
      }
    }

    return result || null;
  }

  setKnownAddress(name: string, address: string): void {
    this.addresses.set(name, address);
  }

  createSigner(mnemonic?: string, index = 0): Signer & { address?: string } {
    const {
      ethers: { Wallet, provider },
    } = this.hre;

    return Wallet.fromMnemonic(
      mnemonic || HARDHAT_MNEMONIC,
      `${HARDHAT_PATH_PREFIX}${index}`,
    ).connect(provider);
  }

  createSigners(
    mnemonic?: string,
    count = 5,
  ): Array<Signer & { address?: string }> {
    return Array(count)
      .fill(1)
      .map((value, index) => this.createSigner(mnemonic, index));
  }

  async getContract<T extends Contract = Contract>(
    alias: string,
  ): Promise<T & { alias?: string }> {
    const result = await this.getDeployedContract<T>(alias);

    if (!result) {
      throw new Error(`Contract ${alias} not found`);
    }

    return result;
  }

  async getDeployedContract<T extends Contract = Contract>(
    alias: string,
  ): Promise<T & { alias?: string }> {
    let result: T & { alias?: string } = null;

    try {
      const {
        deployments: { get },
        ethers: { provider },
      } = this.hre;
      const { address, abi } = await get(alias);

      result = new Contract(address, abi, provider) as any;
      result.alias = alias;
    } catch (err) {
      //
    }

    return result;
  }

  async getCurrentBlockTimestamp(): Promise<number> {
    const { provider } = this.hre.ethers;

    const { timestamp } = await provider.getBlock('latest');

    return timestamp;
  }

  async increaseNextBlockTimestamp(value = 1): Promise<number> {
    const timestamp = await this.getCurrentBlockTimestamp();

    return this.setNextBlockTimestamp(timestamp + value);
  }

  async setNextBlockTimestamp(timestamp: number): Promise<number> {
    const { provider } = this.hre.network;

    await provider.send(
      'evm_setNextBlockTimestamp', //
      [
        timestamp, //
      ],
    );

    return timestamp;
  }

  async createSnapshot(
    options: {
      reset?: boolean;
    } = {},
  ): Promise<string> {
    const { provider } = this.hre.network;

    const snapshotId: string = await provider.send('evm_snapshot');

    const { reset } = options;

    if (reset) {
      this.snapshotIds = [snapshotId];
    } else {
      this.snapshotIds.push(snapshotId);
    }

    return snapshotId;
  }

  async revertSnapshot(
    options: {
      snapshotId?: string;
      recreate?: boolean;
    } = {},
  ): Promise<boolean> {
    options = {
      recreate: true,
      ...options,
    };

    let result = false;

    let { snapshotId } = options;

    if (snapshotId) {
      this.snapshotIds = this.snapshotIds.filter(
        (value) => value !== snapshotId,
      );
    } else {
      snapshotId = this.snapshotIds.pop();
    }

    if (snapshotId) {
      const { provider } = this.hre.network;

      result = await provider.send('evm_revert', [snapshotId]);
    }

    if (options.recreate) {
      await this.createSnapshot();
    }

    return result;
  }

  resetSnapshots(): void {
    this.snapshotIds = [];
  }

  async getAccounts(): Promise<string[]> {
    const signers = await this.getSigners();

    return signers.map(({ address }) => address);
  }

  async getSigners(): Promise<SignerWithAddress[]> {
    if (!this.signers) {
      const { getSigners } = this.hre.ethers;

      this.signers = await getSigners();
    }

    if (!this.signers.length) {
      const { buildEnvKey } = this.hre.processNetworkEnvs;

      const envKey = buildEnvKey(ProcessEnvNames.PrivateKey);

      throw new Error(`Undefined '${envKey}' environment variable`);
    }

    return this.signers;
  }

  async deployContract<T extends Contract>(
    name: string,
    ...args: any[]
  ): Promise<T> {
    const { getContractFactory } = this.hre.ethers;

    const contractFactory = await getContractFactory(name);

    const result = await contractFactory.deploy(...args);

    await result.deployed();

    return result as T;
  }

  async processTransaction(p: Promise<ContractTransaction>): Promise<{
    tx: ContractTransaction;
    receipt: ContractReceipt;
  }> {
    const tx = await p;
    const receipt = await tx.wait();

    return {
      tx,
      receipt,
    };
  }

  randomAddress(): string {
    const { utils } = this.hre.ethers;

    return utils.getAddress(utils.hexlify(utils.randomBytes(20)));
  }

  randomHex32(): string {
    const { utils } = this.hre.ethers;

    return utils.hexlify(utils.randomBytes(32));
  }

  logNetwork(clear = true): void {
    const {
      network: {
        name,
        config: { chainId },
      },
    } = this.hre;

    if (clear) {
      console.clear();
    }

    console.log('Network ', kleur.green(`${name} #${chainId}`));
    console.log();
  }

  logContract(contract: Contract & { alias?: string }): void {
    const { alias, address } = contract;

    console.log('Contract', kleur.yellow(alias));
    console.log('        ', kleur.cyan(address));
  }

  logTransaction(hash: string): void {
    console.log();
    console.log(
      `${kleur.blue('→')} Transaction sent (hash: ${kleur.dim(hash)})`,
    );
  }

  logAny(message: string, value: any): void {
    const { BigNumber } = this.hre.ethers;

    let text: string;

    switch (typeof value) {
      case 'object':
        text = BigNumber.from(value).toString();
        break;

      case 'boolean':
        text = value ? 'true' : 'false';
        break;

      default:
        text = `${value}`;
    }

    console.log(`${kleur.blue('→')} ${message}: ${kleur.green(text)}`);
  }

  exitWithError(message: string): void {
    console.log(`${kleur.red('→')} ${kleur.red(message)}`);
    // eslint-disable-next-line no-process-exit
    process.exit(0);
  }

  logExit(): void {
    console.clear();
    console.log();
    console.log(kleur.italic('bye, bye ...'));
    console.log();
  }
}
