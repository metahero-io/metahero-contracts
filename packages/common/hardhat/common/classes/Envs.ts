import { URL } from 'url';
import { utils } from 'ethers';
import { bindObjectMethods } from '../utils';

const { DEBUG_ENVS } = process.env;

export class Envs {
  static processEnvs = new Envs({
    ...process.env,
  });

  constructor(
    private readonly data: Record<string, string>,
    private readonly namespace: string = null,
  ) {
    bindObjectMethods(this);
  }

  useNamespace(namespace: string): Envs {
    return new Envs(this.data, namespace);
  }

  buildEnvKey(name: string): string {
    if (this.namespace) {
      name = `${this.namespace}.${name}`;
    }

    return name
      .replace(/([a-z]+)([A-Z])/g, (found, part1, part2) => {
        return `${part1}-${part2}`;
      })
      .replace(/[- .]/gi, '_')
      .toUpperCase();
  }

  getEnvAsAddress(name: string, defaultValue: string = null): string {
    const value = this.getEnvValue(name) || '';

    let result: string = null;

    try {
      result = utils.getAddress(value);
    } catch (err) {
      //
    }

    return result || defaultValue;
  }

  getEnvAsAddressArray(name: string, defaultValue: string[] = []): string[] {
    const value = this.getEnvValue(name) || '';

    let result = value
      .split(',')
      .map((address) => {
        let result: string = null;

        try {
          result = utils.getAddress(address);
        } catch (err) {
          //
        }

        return result;
      })
      .filter((value) => !!value);

    if (!result.length) {
      result = defaultValue;
    }

    return result;
  }

  getEnvAsAmount(name: string, defaultValue: string): string {
    const value = this.getEnvValue(name) || defaultValue;

    return utils.parseEther(value).toString();
  }

  getEnvAsBool(name: string, defaultValue = false): boolean {
    const value = this.getEnvValue(name);

    let result: boolean;

    if (!value) {
      result = defaultValue;
    } else {
      switch (value.trim().toUpperCase()[0]) {
        case '1':
        case 'Y':
        case 'T':
          result = true;
          break;

        default:
          result = false;
      }
    }

    return result;
  }

  getEnvAsHex32(name: string, defaultValue: string = null): string {
    const value = this.getEnvValue(name);

    return value && utils.isHexString(value, 32) ? value : defaultValue;
  }

  getEnvAsNumber(name: string, defaultValue: number): number {
    const value = this.getEnvValue(name);
    const parsed = parseInt(value, 10);

    return parsed === 0 || parsed ? parsed : defaultValue;
  }

  getEnvAsURL(name: string, defaultValue: string = null): string {
    const value = this.getEnvValue(name);

    let url: URL;

    try {
      url = new URL(value);
    } catch (err) {
      //
    }

    return url ? url.href : defaultValue;
  }

  getEnvValue(key: string): string {
    key = this.buildEnvKey(key);

    const result = this.data[key];

    if (DEBUG_ENVS) {
      console.log(`${key}=${result || ''}`);
    }

    return this.data[key];
  }
}
