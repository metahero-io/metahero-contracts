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
  'MetaheroToken ABI:',
  getContractAbi(ContractNames.MetaheroToken),
);

console.log(
  'MetaheroToken BSC address:', 
  getContractAddress(ContractNames.MetaheroToken, '56'), // chainId: 56
);

console.log(
  'MetaheroToken BSC testnet address:', 
  getContractAddress(ContractNames.MetaheroToken, 97), // chainId: 97
);
```

## License

MIT

[npm-image]: https://badge.fury.io/js/%40metahero%2Fcontracts.svg
[npm-url]: https://npmjs.org/package/@metahero/contracts
[license-image]: https://img.shields.io/badge/License-MIT-yellow.svg
[license-url]: https://github.com/metahero-token/metahero-contracts/blob/master/LICENSE
