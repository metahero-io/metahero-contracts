# Metahero contracts

[![License MIT][license-image]][license-url]
[![Coverage workflow][coverage-image]][coverage-url]
[![Linter and tests workflow][linter-and-tests-image]][linter-and-tests-url]

## Installation

```bash
$ git clone https://github.com/metahero-io/metahero-contracts.git
$ cd ./metahero-contracts
$ npm i
$ npm run bootstrap
$ npm run link
```

## Packages

* [@metahero/token-contracts](./packages/token) - Metahero token contracts 

## Development

### NPM scripts 

```bash
$ npm run bootstrap   # bootstraps lerna project
$ npm run link        # links all packages dependencies
$ npm run compile     # compiles all contracts in all packages
$ npm run coverage    # runs coverage tests in all packages
$ npm run test        # runs unit tests in all packages
$ npm run build       # builds `./dist`
```

## License

[MIT][license-url]

[license-image]: https://img.shields.io/badge/License-MIT-yellow.svg
[license-url]: https://github.com/metahero-io/metahero-contracts/blob/master/LICENSE

[coverage-image]: https://github.com/metahero-io//metahero-contracts/actions/workflows/coverage.yml/badge.svg
[coverage-url]: https://github.com/metahero-io//metahero-contracts/actions/workflows/coverage.yml

[linter-and-tests-image]: https://github.com/metahero-io/metahero-contracts/actions/workflows/linter-and-tests.yml/badge.svg
[linter-and-tests-url]: https://github.com/metahero-io//metahero-contracts/actions/workflows/linter-and-tests.yml
