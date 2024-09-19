// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

error InsufficientBalance();
error InsufficientContractBalance();

contract TokenSwap {
    struct Order {
        uint256 orderId;
        address seller;
        address buyer;
        address tokenIn;
        uint256 amountIn;
        address tokenOut;
        uint256 amountOut;
        bool isActive;
    }

    // Keep track of orders
    uint256 public orderCount;
    mapping(uint256 => Order) public orders;

    event OrderCreated(
        uint256 orderId,
        address seller,
        address tokenIn,
        uint256 amountIn,
        address tokenOut,
        uint256 amountOut
    );
    event OrderCompleted(uint256 orderId, address buyer);
    event OrderCancelled(uint256 orderId);

    // Create a new order
    function createOrder(
        address _tokenIn,
        uint256 _amountIn,
        address _tokenOut,
        uint256 _amountOut
    ) external {
        // Transfer offered tokens from seller to
        if (IERC20(_tokenIn).balanceOf(msg.sender) < _amountIn) {
            revert InsufficientBalance();
        }
        IERC20(_tokenIn).transferFrom(msg.sender, address(this), _amountIn);
        uint id = orderCount + 1;
        Order storage order = orders[id];
        order.orderId = id;
        order.amountIn = _amountIn;
        order.seller = msg.sender;
        order.tokenIn = _tokenIn;
        order.tokenOut = _tokenOut;
        order.amountOut = _amountOut;
        order.isActive = true;
        orderCount++;
        emit OrderCreated(
            orderCount,
            msg.sender,
            _tokenIn,
            _amountIn,
            _tokenOut,
            _amountOut
        );
    }

    // Complete an order
    function completeOrder(uint256 _orderId) external {
        Order storage order = orders[_orderId];
        require(order.orderId != 0, "invalid order");
        require(order.isActive, "Order is not active");

        // Buyer sends wanted tokens to the seller
        if (IERC20(order.tokenOut).balanceOf(msg.sender) < order.amountOut) {
            revert InsufficientBalance();
        }
        if (IERC20(order.tokenIn).balanceOf(address(this)) < order.amountIn) {
            revert InsufficientContractBalance();
        }
        IERC20(order.tokenOut).transferFrom(
            msg.sender,
            order.seller,
            order.amountOut
        );

        // Contract sends offered tokens to the buyer

        IERC20(order.tokenIn).transfer(msg.sender, order.amountIn);

        // Mark the order as inactive
        order.isActive = false;
        order.buyer = msg.sender;

        emit OrderCompleted(_orderId, msg.sender);
    }
}
