import {
  time,
  loadFixture,
} from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";
import { expect } from "chai";
import hre, { ethers } from "hardhat";

describe("Lock", function () {
  async function deployToken() {
    // Contracts are deployed using the first signer/account by default
    const [owner, otherAccount] = await hre.ethers.getSigners();

    const erc20Token = await hre.ethers.getContractFactory("Web3CXI");
    const token = await erc20Token.deploy();

    return { token };
  }
  async function deploySmileToken() {
    // Contracts are deployed using the first signer/account by default


    const erc20Token = await hre.ethers.getContractFactory("Smile");
    const token = await erc20Token.deploy();

    return { token };
  }
  async function deployTokenSwap() {
    const [owner, addr1, addr2, addr3] = await hre.ethers.getSigners();
    const { token } = await loadFixture(deployToken)
    const { token: smileToken } = await loadFixture(deploySmileToken)

    const Swap = await hre.ethers.getContractFactory("TokenSwap");
    const swap = await Swap.deploy();

    return { swap, owner, addr1, addr2, addr3, token, smileToken };
  }

  describe("Order", function () {
    it("Should create order", async function () {
      const { swap, owner, smileToken, token } = await loadFixture(deployTokenSwap);

      const amountIn = ethers.parseUnits("100", 18);
      const amountOut = ethers.parseUnits("100", 18);

      await token.approve(swap, amountIn);
      await expect(swap.createOrder(token, amountIn, smileToken, amountOut)).to.emit(swap, "OrderCreated").withArgs(1, owner.address, token, amountIn, smileToken, amountOut);
      expect(await swap.orderCount()).to.equal(1);
      expect(await token.balanceOf(swap)).to.equal(amountIn);
      // await smileToken.approve(swap.address, 100);
    });

    it("Should fufil order", async function () {
      const { swap, owner, smileToken, token, addr1 } = await loadFixture(deployTokenSwap);

      const amountIn = ethers.parseUnits("100", 18);
      const amountOut = ethers.parseUnits("100", 18);

      await token.approve(swap, amountIn);
      await expect(swap.createOrder(token, amountIn, smileToken, amountOut)).to.emit(swap, "OrderCreated").withArgs(1, owner.address, token, amountIn, smileToken, amountOut);
      expect(await swap.orderCount()).to.equal(1);
      expect(await token.balanceOf(swap)).to.equal(amountIn);
      await smileToken.transfer(addr1, ethers.parseUnits("200", 18));
      await smileToken.connect(addr1).approve(swap, amountOut);
      await expect(await swap.connect(addr1).completeOrder(1)).emit(swap, "OrderCompleted").withArgs(1, addr1.address);

    });


  });
});
