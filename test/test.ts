import { time, loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";
import { expect } from "chai";
import { ethers } from "hardhat";

async function deployNotReentrancyVulnerableContracts() {
  // Contracts are deployed using the first signer/account by default
  const [owner, attackAccount] = await ethers.getSigners();

  const NotReentrancyVulnerableContract = await ethers.getContractFactory(
    "NotReentrancyVulnerable"
  );
  const ownerNotReentrancyVulnerableContract =
    await NotReentrancyVulnerableContract.deploy();

  const AttackContract = await ethers.getContractFactory("Attack");
  const attackContract = await AttackContract.connect(attackAccount).deploy(
    ownerNotReentrancyVulnerableContract.address,
    { value: ethers.constants.WeiPerEther }
  );

  const attackerVulnerableContract =
    await ownerNotReentrancyVulnerableContract.connect(attackAccount);

  const provider = ownerNotReentrancyVulnerableContract.provider;

  return {
    ownerNotReentrancyVulnerableContract,
    attackerVulnerableContract,
    attackContract,
    owner,
    attackAccount,
    provider,
  };
}

async function deployReentrancyVulnerableContracts() {
  // Contracts are deployed using the first signer/account by default
  const [owner, attackAccount] = await ethers.getSigners();

  const ReentrancyVulnerableContract = await ethers.getContractFactory(
    "ReentrancyVulnerable"
  );
  const ownerReentrancyVulnerableContract =
    await ReentrancyVulnerableContract.deploy();

  const AttackContract = await ethers.getContractFactory("Attack");
  const attackContract = await AttackContract.connect(attackAccount).deploy(
    ownerReentrancyVulnerableContract.address,
    { value: ethers.constants.WeiPerEther }
  );

  const attackerVulnerableContract =
    await ownerReentrancyVulnerableContract.connect(attackAccount);

  const provider = ownerReentrancyVulnerableContract.provider;

  return {
    ownerReentrancyVulnerableContract,
    attackerVulnerableContract,
    attackContract,
    owner,
    attackAccount,
    provider,
  };
}

describe("Demonstration", function () {
  describe("NotReentrancyVulnerableContract", function () {
    it("Attack reverts with underflow", async function () {
      const {
        ownerNotReentrancyVulnerableContract,
        attackContract,
        owner,
        attackAccount,
        provider,
      } = await loadFixture(deployNotReentrancyVulnerableContracts);

      // owner deposits 1 ETH
      await ownerNotReentrancyVulnerableContract.deposit({
        value: ethers.constants.WeiPerEther,
      });

      expect(
        await ownerNotReentrancyVulnerableContract.balances(owner.address)
      ).to.equal(ethers.constants.WeiPerEther);
      expect(
        await provider.getBalance(ownerNotReentrancyVulnerableContract.address)
      ).to.equal(ethers.constants.WeiPerEther);

      expect(await provider.getBalance(attackContract.address)).to.equal(
        ethers.constants.WeiPerEther
      );

      // play the attack
      expect(attackContract.attack()).to.be.reverted;
      expect(
        await provider.getBalance(ownerNotReentrancyVulnerableContract.address)
      ).to.equal(ethers.constants.WeiPerEther);
    });
  });

  describe("ReentrancyVulnerableContract", function () {
    it("Can deposit 1ETH and withdraw 2ETH with reentrancy contract", async function () {
      const {
        ownerReentrancyVulnerableContract,
        attackerVulnerableContract,
        attackContract,
        owner,
        attackAccount,
        provider,
      } = await loadFixture(deployReentrancyVulnerableContracts);

      // owner deposits 1 ETH
      await ownerReentrancyVulnerableContract.deposit({
        value: ethers.constants.WeiPerEther,
      });

      expect(
        await ownerReentrancyVulnerableContract.balances(owner.address)
      ).to.equal(ethers.constants.WeiPerEther);
      expect(
        await provider.getBalance(ownerReentrancyVulnerableContract.address)
      ).to.equal(ethers.constants.WeiPerEther);

      expect(await provider.getBalance(attackContract.address)).to.equal(
        ethers.constants.WeiPerEther
      );

      // play the attack
      const prevBalance = await provider.getBalance(attackContract.address);
      await attackContract.attack();

      expect(
        await provider.getBalance(ownerReentrancyVulnerableContract.address)
      ).to.equal(ethers.constants.Zero);

      expect(await provider.getBalance(attackContract.address)).to.equal(
        prevBalance.add(ethers.constants.WeiPerEther)
      );
    });
  });
});
