export interface ContractsMD {
  [key: string]: {
    [key: string]: {
      address: string;
      transactionHash: string;
    };
  };
}
