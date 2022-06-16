import { ContractNames } from './constants';

export function getContractAddress(
  contractName: ContractNames,
  chainId?: string | number,
): string;

export function getContractABI(contractName: ContractNames): any;
