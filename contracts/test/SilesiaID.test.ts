import { ethers } from "hardhat";
import { expect } from "chai";

describe("SilesiaID", function () {
  async function deploy() {
    const [owner, user] = await ethers.getSigners();
    const SilesiaID = await ethers.getContractFactory("SilesiaID");
    const contract = await SilesiaID.deploy();
    return { contract, owner, user };
  }

  it("mintuje certyfikat", async function () {
    const { contract, user } = await deploy();
    const nipHash = ethers.keccak256(ethers.toUtf8Bytes("6310000000"));
    const krsHash = ethers.keccak256(ethers.toUtf8Bytes("0000123456"));

    await contract.mint(user.address, nipHash, krsHash, 2, "TEST01");

    const identity = await contract.getIdentityByCertId("TEST01");
    expect(identity.isActive).to.be.true;
    expect(identity.trustLevel).to.equal(2);
  });

  it("blokuje transfer (soulbound)", async function () {
    const { contract, owner, user } = await deploy();
    const nipHash = ethers.keccak256(ethers.toUtf8Bytes("6310000000"));
    await contract.mint(user.address, nipHash, ethers.ZeroHash, 1, "TEST02");

    await expect(
      contract.connect(user).transferFrom(user.address, owner.address, 1)
    ).to.be.revertedWith("SilesiaID: token is soulbound");
  });

  it("revoke dezaktywuje certyfikat", async function () {
    const { contract, user } = await deploy();
    const nipHash = ethers.keccak256(ethers.toUtf8Bytes("6310000000"));
    await contract.mint(user.address, nipHash, ethers.ZeroHash, 1, "TEST03");

    await contract.revoke("TEST03");
    const identity = await contract.getIdentityByCertId("TEST03");
    expect(identity.isActive).to.be.false;
  });
});
