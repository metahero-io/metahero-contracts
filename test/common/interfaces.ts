import { Signer as BaseSigner, utils, providers } from 'ethers';

export interface Signer extends BaseSigner {
  address: string;

  getAddress(): Promise<string>;

  signMessage(message: string | utils.Bytes): Promise<string>;

  signTransaction(
    transaction: utils.Deferrable<providers.TransactionRequest>,
  ): Promise<string>;

  sendTransaction(
    transaction: utils.Deferrable<providers.TransactionRequest>,
  ): Promise<providers.TransactionResponse>;

  connect(provider: providers.Provider): Signer;

  toJSON(): string;
}
