import { MAX_PERCENTAGE } from '../constants';

export function parsePercentage(value: number): number {
  return Math.floor((value * MAX_PERCENTAGE) / 100);
}
