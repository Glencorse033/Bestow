const hre = require("hardhat");

async function main() {
    const [deployer] = await hre.ethers.getSigners();
    console.log("Deploying contracts with the account:", deployer.address);

    // 1. Deploy BestowHub
    const BestowHub = await hre.ethers.getContractFactory("BestowHub");
    const bestowHub = await BestowHub.deploy();
    await bestowHub.waitForDeployment();
    console.log(`BestowHub deployed to: ${bestowHub.target}`);

    // 2. Deploy BestowVault (Stablecoin Yield Alpha)
    const BestowVault = await hre.ethers.getContractFactory("BestowVault");
    const vault = await BestowVault.deploy(
        "Stablecoin Yield Alpha", // Name
        "USDC",                   // Asset
        7 * 24 * 60 * 60,         // 7 days lockup
        1250                      // 12.5% APY (1250 basis points)
    );
    await vault.waitForDeployment();
    console.log(`BestowVault (USDC) deployed to: ${vault.target}`);

    // 3. Log details for Frontend use
    console.log("\n--- Frontend Configuration ---");
    console.log("NEXT_PUBLIC_BESTOW_HUB_ADDRESS=" + bestowHub.target);
    console.log("NEXT_PUBLIC_BESTOW_VAULT_ADDRESS=" + vault.target);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
