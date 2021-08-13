import { expect } from "chai";
import { ethers } from "hardhat";

describe("Deployment", function() {
    it("Should deploy with success ERC20 Equalizer Token", async function() {
        const ERC20 = await ethers.getContractFactory("ERC20");
        const erc20 = await ERC20.deploy("Equalizer", "EQZ");

        await erc20.deployed();

        console.log("Equalizer ERC20 contract deployed to:", erc20.address);

        expect(erc20.address).to.be.properAddress;
    });
});

