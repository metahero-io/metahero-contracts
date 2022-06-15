// SPDX-License-Identifier: GPL-3.0
/* solhint-disable */
pragma solidity ^0.6.12;

import "../core/erc20/IERC20.sol";
import "../core/erc20/IWrappedNative.sol";
import "../core/math/SafeMathLib.sol";
import "../uniswapV2/IUniswapV2Factory.sol";
import "../uniswapV2/IUniswapV2Pair.sol";
import "../uniswapV2/IUniswapV2Router02.sol";
import "./PancakeLibrary.sol";
import "./PancakeTransferHelper.sol";

/**
 * @title Pancake router
 *
 * @notice Based on https://github.com/pancakeswap/pancake-swap-periphery/blob/d769a6d136b74fde82502ec2f9334acc1afc0732/contracts/PancakeRouter.sol
 */
contract PancakeRouter is IUniswapV2Router02 {
  using SafeMathLib for uint256;

  address public immutable override factory;
  address public immutable override WETH;

  // modifiers

  modifier ensure(uint256 deadline) {
    require(deadline >= block.timestamp, "PancakeRouter: EXPIRED");
    _;
  }

  constructor(address _factory, address _WETH) public {
    factory = _factory;
    WETH = _WETH;
  }

  // external functions

  receive() external payable {
    assert(msg.sender == WETH);
    // only accept ETH via fallback from the WETH contract
  }

  function addLiquidity(
    address tokenA,
    address tokenB,
    uint256 amountADesired,
    uint256 amountBDesired,
    uint256 amountAMin,
    uint256 amountBMin,
    address to,
    uint256 deadline
  )
    external
    override
    ensure(deadline)
    returns (
      uint256 amountA,
      uint256 amountB,
      uint256 liquidity
    )
  {
    (amountA, amountB) = _addLiquidity(
      tokenA,
      tokenB,
      amountADesired,
      amountBDesired,
      amountAMin,
      amountBMin
    );
    address pair = PancakeLibrary.pairFor(factory, tokenA, tokenB);
    PancakeTransferHelper.safeTransferFrom(tokenA, msg.sender, pair, amountA);
    PancakeTransferHelper.safeTransferFrom(tokenB, msg.sender, pair, amountB);
    liquidity = IUniswapV2Pair(pair).mint(to);
  }

  function addLiquidityETH(
    address token,
    uint256 amountTokenDesired,
    uint256 amountTokenMin,
    uint256 amountETHMin,
    address to,
    uint256 deadline
  )
    external
    payable
    override
    ensure(deadline)
    returns (
      uint256 amountToken,
      uint256 amountETH,
      uint256 liquidity
    )
  {
    (amountToken, amountETH) = _addLiquidity(
      token,
      WETH,
      amountTokenDesired,
      msg.value,
      amountTokenMin,
      amountETHMin
    );
    address pair = PancakeLibrary.pairFor(factory, token, WETH);
    PancakeTransferHelper.safeTransferFrom(
      token,
      msg.sender,
      pair,
      amountToken
    );
    IWrappedNative(WETH).deposit{value: amountETH}();
    assert(IWrappedNative(WETH).transfer(pair, amountETH));
    liquidity = IUniswapV2Pair(pair).mint(to);
    // refund dust eth, if any
    if (msg.value > amountETH)
      PancakeTransferHelper.safeTransferBNB(msg.sender, msg.value - amountETH);
  }

  function removeLiquidityETHWithPermit(
    address token,
    uint256 liquidity,
    uint256 amountTokenMin,
    uint256 amountETHMin,
    address to,
    uint256 deadline,
    bool approveMax,
    uint8 v,
    bytes32 r,
    bytes32 s
  ) external override returns (uint256 amountToken, uint256 amountETH) {
    address pair = PancakeLibrary.pairFor(factory, token, WETH);
    uint256 value = approveMax ? uint256(-1) : liquidity;
    IUniswapV2Pair(pair).permit(
      msg.sender,
      address(this),
      value,
      deadline,
      v,
      r,
      s
    );
    (amountToken, amountETH) = removeLiquidityETH(
      token,
      liquidity,
      amountTokenMin,
      amountETHMin,
      to,
      deadline
    );
  }

  function removeLiquidityWithPermit(
    address tokenA,
    address tokenB,
    uint256 liquidity,
    uint256 amountAMin,
    uint256 amountBMin,
    address to,
    uint256 deadline,
    bool approveMax,
    uint8 v,
    bytes32 r,
    bytes32 s
  ) external override returns (uint256 amountA, uint256 amountB) {
    address pair = PancakeLibrary.pairFor(factory, tokenA, tokenB);
    uint256 value = approveMax ? uint256(-1) : liquidity;
    IUniswapV2Pair(pair).permit(
      msg.sender,
      address(this),
      value,
      deadline,
      v,
      r,
      s
    );
    (amountA, amountB) = removeLiquidity(
      tokenA,
      tokenB,
      liquidity,
      amountAMin,
      amountBMin,
      to,
      deadline
    );
  }

  function removeLiquidityETHWithPermitSupportingFeeOnTransferTokens(
    address token,
    uint256 liquidity,
    uint256 amountTokenMin,
    uint256 amountETHMin,
    address to,
    uint256 deadline,
    bool approveMax,
    uint8 v,
    bytes32 r,
    bytes32 s
  ) external override returns (uint256 amountETH) {
    address pair = PancakeLibrary.pairFor(factory, token, WETH);
    uint256 value = approveMax ? uint256(-1) : liquidity;
    IUniswapV2Pair(pair).permit(
      msg.sender,
      address(this),
      value,
      deadline,
      v,
      r,
      s
    );
    amountETH = removeLiquidityETHSupportingFeeOnTransferTokens(
      token,
      liquidity,
      amountTokenMin,
      amountETHMin,
      to,
      deadline
    );
  }

  function swapExactTokensForTokens(
    uint256 amountIn,
    uint256 amountOutMin,
    address[] calldata path,
    address to,
    uint256 deadline
  ) external override ensure(deadline) returns (uint256[] memory amounts) {
    amounts = PancakeLibrary.getAmountsOut(factory, amountIn, path);
    require(
      amounts[amounts.length - 1] >= amountOutMin,
      "PancakeRouter: INSUFFICIENT_OUTPUT_AMOUNT"
    );
    PancakeTransferHelper.safeTransferFrom(
      path[0],
      msg.sender,
      PancakeLibrary.pairFor(factory, path[0], path[1]),
      amounts[0]
    );
    _swap(amounts, path, to);
  }

  function swapTokensForExactTokens(
    uint256 amountOut,
    uint256 amountInMax,
    address[] calldata path,
    address to,
    uint256 deadline
  ) external override ensure(deadline) returns (uint256[] memory amounts) {
    amounts = PancakeLibrary.getAmountsIn(factory, amountOut, path);
    require(amounts[0] <= amountInMax, "PancakeRouter: EXCESSIVE_INPUT_AMOUNT");
    PancakeTransferHelper.safeTransferFrom(
      path[0],
      msg.sender,
      PancakeLibrary.pairFor(factory, path[0], path[1]),
      amounts[0]
    );
    _swap(amounts, path, to);
  }

  function swapExactETHForTokens(
    uint256 amountOutMin,
    address[] calldata path,
    address to,
    uint256 deadline
  )
    external
    payable
    override
    ensure(deadline)
    returns (uint256[] memory amounts)
  {
    require(path[0] == WETH, "PancakeRouter: INVALID_PATH");
    amounts = PancakeLibrary.getAmountsOut(factory, msg.value, path);
    require(
      amounts[amounts.length - 1] >= amountOutMin,
      "PancakeRouter: INSUFFICIENT_OUTPUT_AMOUNT"
    );
    IWrappedNative(WETH).deposit{value: amounts[0]}();
    assert(
      IWrappedNative(WETH).transfer(
        PancakeLibrary.pairFor(factory, path[0], path[1]),
        amounts[0]
      )
    );
    _swap(amounts, path, to);
  }

  function swapTokensForExactETH(
    uint256 amountOut,
    uint256 amountInMax,
    address[] calldata path,
    address to,
    uint256 deadline
  ) external override ensure(deadline) returns (uint256[] memory amounts) {
    require(path[path.length - 1] == WETH, "PancakeRouter: INVALID_PATH");
    amounts = PancakeLibrary.getAmountsIn(factory, amountOut, path);
    require(amounts[0] <= amountInMax, "PancakeRouter: EXCESSIVE_INPUT_AMOUNT");
    PancakeTransferHelper.safeTransferFrom(
      path[0],
      msg.sender,
      PancakeLibrary.pairFor(factory, path[0], path[1]),
      amounts[0]
    );
    _swap(amounts, path, address(this));
    IWrappedNative(WETH).withdraw(amounts[amounts.length - 1]);
    PancakeTransferHelper.safeTransferBNB(to, amounts[amounts.length - 1]);
  }

  function swapExactTokensForETH(
    uint256 amountIn,
    uint256 amountOutMin,
    address[] calldata path,
    address to,
    uint256 deadline
  ) external override ensure(deadline) returns (uint256[] memory amounts) {
    require(path[path.length - 1] == WETH, "PancakeRouter: INVALID_PATH");
    amounts = PancakeLibrary.getAmountsOut(factory, amountIn, path);
    require(
      amounts[amounts.length - 1] >= amountOutMin,
      "PancakeRouter: INSUFFICIENT_OUTPUT_AMOUNT"
    );
    PancakeTransferHelper.safeTransferFrom(
      path[0],
      msg.sender,
      PancakeLibrary.pairFor(factory, path[0], path[1]),
      amounts[0]
    );
    _swap(amounts, path, address(this));
    IWrappedNative(WETH).withdraw(amounts[amounts.length - 1]);
    PancakeTransferHelper.safeTransferBNB(to, amounts[amounts.length - 1]);
  }

  function swapETHForExactTokens(
    uint256 amountOut,
    address[] calldata path,
    address to,
    uint256 deadline
  )
    external
    payable
    override
    ensure(deadline)
    returns (uint256[] memory amounts)
  {
    require(path[0] == WETH, "PancakeRouter: INVALID_PATH");
    amounts = PancakeLibrary.getAmountsIn(factory, amountOut, path);
    require(amounts[0] <= msg.value, "PancakeRouter: EXCESSIVE_INPUT_AMOUNT");
    IWrappedNative(WETH).deposit{value: amounts[0]}();
    assert(
      IWrappedNative(WETH).transfer(
        PancakeLibrary.pairFor(factory, path[0], path[1]),
        amounts[0]
      )
    );
    _swap(amounts, path, to);
    // refund dust eth, if any
    if (msg.value > amounts[0])
      PancakeTransferHelper.safeTransferBNB(msg.sender, msg.value - amounts[0]);
  }

  function swapExactTokensForTokensSupportingFeeOnTransferTokens(
    uint256 amountIn,
    uint256 amountOutMin,
    address[] calldata path,
    address to,
    uint256 deadline
  ) external override ensure(deadline) {
    PancakeTransferHelper.safeTransferFrom(
      path[0],
      msg.sender,
      PancakeLibrary.pairFor(factory, path[0], path[1]),
      amountIn
    );
    uint256 balanceBefore = IERC20(path[path.length - 1]).balanceOf(to);
    _swapSupportingFeeOnTransferTokens(path, to);
    require(
      IERC20(path[path.length - 1]).balanceOf(to).sub(balanceBefore) >=
        amountOutMin,
      "PancakeRouter: INSUFFICIENT_OUTPUT_AMOUNT"
    );
  }

  function swapExactETHForTokensSupportingFeeOnTransferTokens(
    uint256 amountOutMin,
    address[] calldata path,
    address to,
    uint256 deadline
  ) external payable override ensure(deadline) {
    require(path[0] == WETH, "PancakeRouter: INVALID_PATH");
    uint256 amountIn = msg.value;
    IWrappedNative(WETH).deposit{value: amountIn}();
    assert(
      IWrappedNative(WETH).transfer(
        PancakeLibrary.pairFor(factory, path[0], path[1]),
        amountIn
      )
    );
    uint256 balanceBefore = IERC20(path[path.length - 1]).balanceOf(to);
    _swapSupportingFeeOnTransferTokens(path, to);
    require(
      IERC20(path[path.length - 1]).balanceOf(to).sub(balanceBefore) >=
        amountOutMin,
      "PancakeRouter: INSUFFICIENT_OUTPUT_AMOUNT"
    );
  }

  function swapExactTokensForETHSupportingFeeOnTransferTokens(
    uint256 amountIn,
    uint256 amountOutMin,
    address[] calldata path,
    address to,
    uint256 deadline
  ) external override ensure(deadline) {
    require(path[path.length - 1] == WETH, "PancakeRouter: INVALID_PATH");
    PancakeTransferHelper.safeTransferFrom(
      path[0],
      msg.sender,
      PancakeLibrary.pairFor(factory, path[0], path[1]),
      amountIn
    );
    _swapSupportingFeeOnTransferTokens(path, address(this));
    uint256 amountOut = IERC20(WETH).balanceOf(address(this));
    require(
      amountOut >= amountOutMin,
      "PancakeRouter: INSUFFICIENT_OUTPUT_AMOUNT"
    );
    IWrappedNative(WETH).withdraw(amountOut);
    PancakeTransferHelper.safeTransferBNB(to, amountOut);
  }

  // public functions

  function removeLiquidity(
    address tokenA,
    address tokenB,
    uint256 liquidity,
    uint256 amountAMin,
    uint256 amountBMin,
    address to,
    uint256 deadline
  )
    public
    override
    ensure(deadline)
    returns (uint256 amountA, uint256 amountB)
  {
    address pair = PancakeLibrary.pairFor(factory, tokenA, tokenB);
    IUniswapV2Pair(pair).transferFrom(msg.sender, pair, liquidity);
    // send liquidity to pair
    (uint256 amount0, uint256 amount1) = IUniswapV2Pair(pair).burn(to);
    (address token0, ) = PancakeLibrary.sortTokens(tokenA, tokenB);
    (amountA, amountB) = tokenA == token0
      ? (amount0, amount1)
      : (amount1, amount0);
    require(amountA >= amountAMin, "PancakeRouter: INSUFFICIENT_A_AMOUNT");
    require(amountB >= amountBMin, "PancakeRouter: INSUFFICIENT_B_AMOUNT");
  }

  function removeLiquidityETH(
    address token,
    uint256 liquidity,
    uint256 amountTokenMin,
    uint256 amountETHMin,
    address to,
    uint256 deadline
  )
    public
    override
    ensure(deadline)
    returns (uint256 amountToken, uint256 amountETH)
  {
    (amountToken, amountETH) = removeLiquidity(
      token,
      WETH,
      liquidity,
      amountTokenMin,
      amountETHMin,
      address(this),
      deadline
    );
    PancakeTransferHelper.safeTransfer(token, to, amountToken);
    IWrappedNative(WETH).withdraw(amountETH);
    PancakeTransferHelper.safeTransferBNB(to, amountETH);
  }

  function removeLiquidityETHSupportingFeeOnTransferTokens(
    address token,
    uint256 liquidity,
    uint256 amountTokenMin,
    uint256 amountETHMin,
    address to,
    uint256 deadline
  ) public override ensure(deadline) returns (uint256 amountETH) {
    (, amountETH) = removeLiquidity(
      token,
      WETH,
      liquidity,
      amountTokenMin,
      amountETHMin,
      address(this),
      deadline
    );
    PancakeTransferHelper.safeTransfer(
      token,
      to,
      IERC20(token).balanceOf(address(this))
    );
    IWrappedNative(WETH).withdraw(amountETH);
    PancakeTransferHelper.safeTransferBNB(to, amountETH);
  }

  // public function (views)

  function getAmountsOut(uint256 amountIn, address[] memory path)
    public
    view
    override
    returns (uint256[] memory amounts)
  {
    return PancakeLibrary.getAmountsOut(factory, amountIn, path);
  }

  function getAmountsIn(uint256 amountOut, address[] memory path)
    public
    view
    override
    returns (uint256[] memory amounts)
  {
    return PancakeLibrary.getAmountsIn(factory, amountOut, path);
  }

  // public function (pure)

  function quote(
    uint256 amountA,
    uint256 reserveA,
    uint256 reserveB
  ) public pure override returns (uint256 amountB) {
    return PancakeLibrary.quote(amountA, reserveA, reserveB);
  }

  function getAmountOut(
    uint256 amountIn,
    uint256 reserveIn,
    uint256 reserveOut
  ) public pure override returns (uint256 amountOut) {
    return PancakeLibrary.getAmountOut(amountIn, reserveIn, reserveOut);
  }

  function getAmountIn(
    uint256 amountOut,
    uint256 reserveIn,
    uint256 reserveOut
  ) public pure override returns (uint256 amountIn) {
    return PancakeLibrary.getAmountIn(amountOut, reserveIn, reserveOut);
  }

  // private functions

  function _addLiquidity(
    address tokenA,
    address tokenB,
    uint256 amountADesired,
    uint256 amountBDesired,
    uint256 amountAMin,
    uint256 amountBMin
  ) private returns (uint256 amountA, uint256 amountB) {
    // create the pair if it doesn't exist yet
    if (IUniswapV2Factory(factory).getPair(tokenA, tokenB) == address(0)) {
      IUniswapV2Factory(factory).createPair(tokenA, tokenB);
    }
    (uint256 reserveA, uint256 reserveB) = PancakeLibrary.getReserves(
      factory,
      tokenA,
      tokenB
    );
    if (reserveA == 0 && reserveB == 0) {
      (amountA, amountB) = (amountADesired, amountBDesired);
    } else {
      uint256 amountBOptimal = PancakeLibrary.quote(
        amountADesired,
        reserveA,
        reserveB
      );
      if (amountBOptimal <= amountBDesired) {
        require(
          amountBOptimal >= amountBMin,
          "PancakeRouter: INSUFFICIENT_B_AMOUNT"
        );
        (amountA, amountB) = (amountADesired, amountBOptimal);
      } else {
        uint256 amountAOptimal = PancakeLibrary.quote(
          amountBDesired,
          reserveB,
          reserveA
        );
        assert(amountAOptimal <= amountADesired);
        require(
          amountAOptimal >= amountAMin,
          "PancakeRouter: INSUFFICIENT_A_AMOUNT"
        );
        (amountA, amountB) = (amountAOptimal, amountBDesired);
      }
    }
  }

  function _swap(
    uint256[] memory amounts,
    address[] memory path,
    address _to
  ) private {
    for (uint256 i; i < path.length - 1; i++) {
      (address input, address output) = (path[i], path[i + 1]);
      (address token0, ) = PancakeLibrary.sortTokens(input, output);
      uint256 amountOut = amounts[i + 1];
      (uint256 amount0Out, uint256 amount1Out) = input == token0
        ? (uint256(0), amountOut)
        : (amountOut, uint256(0));
      address to = i < path.length - 2
        ? PancakeLibrary.pairFor(factory, output, path[i + 2])
        : _to;
      IUniswapV2Pair(PancakeLibrary.pairFor(factory, input, output)).swap(
        amount0Out,
        amount1Out,
        to,
        new bytes(0)
      );
    }
  }

  function _swapSupportingFeeOnTransferTokens(
    address[] memory path,
    address _to
  ) private {
    for (uint256 i; i < path.length - 1; i++) {
      (address input, address output) = (path[i], path[i + 1]);
      (address token0, ) = PancakeLibrary.sortTokens(input, output);
      IUniswapV2Pair pair = IUniswapV2Pair(
        PancakeLibrary.pairFor(factory, input, output)
      );
      uint256 amountInput;
      uint256 amountOutput;
      {
        // scope to avoid stack too deep errors
        (uint256 reserve0, uint256 reserve1, ) = pair.getReserves();
        (uint256 reserveInput, uint256 reserveOutput) = input == token0
          ? (reserve0, reserve1)
          : (reserve1, reserve0);
        amountInput = IERC20(input).balanceOf(address(pair)).sub(reserveInput);
        amountOutput = PancakeLibrary.getAmountOut(
          amountInput,
          reserveInput,
          reserveOutput
        );
      }
      (uint256 amount0Out, uint256 amount1Out) = input == token0
        ? (uint256(0), amountOutput)
        : (amountOutput, uint256(0));
      address to = i < path.length - 2
        ? PancakeLibrary.pairFor(factory, output, path[i + 2])
        : _to;
      pair.swap(amount0Out, amount1Out, to, new bytes(0));
    }
  }
}
