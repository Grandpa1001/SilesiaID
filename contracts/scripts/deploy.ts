import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying with:", deployer.address);

  const SilesiaID = await ethers.getContractFactory("SilesiaID");
  const contract = await SilesiaID.deploy();
  await contract.waitForDeployment();

  const address = await contract.getAddress();
  console.log("SilesiaID deployed to:", address);
  console.log("Add to backend .env: CONTRACT_ADDRESS=" + address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
