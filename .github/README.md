# Metahero contracts

[![NPM version][npm-image]][npm-url]
[![License MIT][license-image]][license-url]

## `MetaheroToken`

* [ERC20](https://github.com/ethereum/EIPs/blob/master/EIPS/eip-20.md) Standard: 
  * name - `Metahero`
  * symbol - `HERO`
  * decimals - `18`
* Total Supply:
  * initial - `10,000,000,000 HERO` _(configurable)_
  * minimal - `100,000,000 HERO` _(configurable)_
* Transaction Fees _(from each holder participant balance)_:
  * burn fee - `0%` _(configurable)_
  * lp fee - `0%` _(configurable)_
  * rewards fee - `0%` _(configurable)_

## [NPM](../README.md)

## [Deployments](../deployments/README.md)

## Development

### Supported networks

| network | config prefix | script alias |
| --- | --- | --- |
| Binance Smart Chain | `BSC` | `bsc` |
| Binance Smart Chain (testnet) | `BSC_TEST` | `bscTest` |

### Configuration

via `env` variables:

| name | note |
| --- | --- |
| `<network config prefix>_PROVIDER_PRIVATE_KEY` | |
| `<network config prefix>_PROVIDER_URL` | _optional_ |
| `<network config prefix>_PROVIDER_GAS` | _optional_ |
| `<network config prefix>_PROVIDER_GAS_PRICE` | _optional_ |
| `<network config prefix>_DAO_MIN_VOTING_PERIOD` | _default_ `24 * 60 * 60` |
| `<network config prefix>_DAO_SNAPSHOT_WINDOW` | _default_ `24 * 60 * 60` |
| `<network config prefix>_TOKEN_TOTAL_SUPPLY` | _default_ `10,000,000,000.000000000000000000` |
| `<network config prefix>_TOKEN_MIN_TOTAL_SUPPLY` | _default_ `100,000,000.000000000000000000` |

### Deployment

```bash
$ # npm run <network script alias>:deploy
$ # example:
$ npm run bsc:deploy  # starts contracts deployment to BSC
```

### Testing

```bash
$ npm run test                  # runs tests
$ npm run test -- --report-gas  # runs tests with gas report
$ npm run coverage              # runs coverage
```

## License

MIT

[npm-image]: https://badge.fury.io/js/%40metahero%2Fcontracts.svg
[npm-url]: https://npmjs.org/package/@metahero/contracts
[license-image]: https://img.shields.io/badge/License-MIT-yellow.svg
[license-url]: https://github.com/metahero-token/metahero-contracts/blob/master/LICENSE
