module.exports = {
  istanbulReporter: [
    'html', //
    'text',
    'json',
  ],
  skipFiles: [
    'core/erc20/ERC20Mock.sol', //
    'uniswapV2',
  ],
};
