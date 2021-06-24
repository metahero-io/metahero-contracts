# Metahero contracts

[![NPM version][npm-image]][npm-url]
[![License MIT][license-image]][license-url]

## Installation

```bash
$ npm i @metahero/contracts -S
```

## Usage

### Javascript

```javascript
import {
  ContractNames, 
  getContractAbi, 
  getContractAddress, 
} from '@metahero/contracts'; 

console.log(
  'HEROToken ABI:',
  getContractAbi(ContractNames.HEROToken),
);

console.log(
  'HEROToken BSC address:', 
  getContractAddress(ContractNames.HEROToken, '56'),
);

console.log(
  'HEROPresale BSC testnet address:', 
  getContractAddress(ContractNames.HEROPresale, '97'),
);

```

## License

MIT

[npm-image]: https://badge.fury.io/js/%40metahero%2Fcontracts.svg
[npm-url]: https://npmjs.org/package/@metahero/contracts
[license-image]: https://img.shields.io/badge/License-MIT-yellow.svg
[license-url]: https://github.com/metahero-token/metahero-contracts/blob/master/LICENSE
