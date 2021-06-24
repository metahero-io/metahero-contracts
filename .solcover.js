module.exports = {
  istanbulReporter: [
    'html', //
    'text',
    'json',
  ],
  skipFiles: [
    'common/erc20/ERC20Mock.sol', //
    'lpManager/uniswapV2',
  ],
};
