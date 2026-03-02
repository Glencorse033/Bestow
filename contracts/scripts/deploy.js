const { ethers, upgrades } = require("hardhat");

async function main() {
    const [deployer] = await ethers.getSigners();
    console.log("Deploying with:", deployer.address);

    const oracleSigner = process.env.ORACLE_SIGNER_ADDRESS;
    const treasury = deployer.address; // update to a real treasury wallet

    // 1. Deploy EURC Mock Token
    const EURC = await ethers.getContractFactory("MockEURC");
    const eurc = await EURC.deploy();
    await eurc.waitForDeployment();
    console.log("EURC Token:    ", await eurc.getAddress());

    // 2. Deploy BestowHub (UUPS Proxy)
    const BestowHub = await ethers.getContractFactory("BestowHub");
    const hub = await upgrades.deployProxy(
        BestowHub,
        [treasury],
        { initializer: "initialize", kind: "uups" }
    );
    await hub.waitForDeployment();
    console.log("BestowHub:     ", await hub.getAddress());

    // Set the Oracle Signer specifically
    await hub.setOracleSigner(oracleSigner);
    console.log("Oracle Signer configured ✅");

    // 3. Deploy USDC Vault (UUPS Proxy)
    const USDC_ADDRESS = "0x3600000000000000000000000000000000000000";
    const VaultFactory = await ethers.getContractFactory("BestowVault4626");
    const usdcVault = await upgrades.deployProxy(
        VaultFactory,
        [USDC_ADDRESS, "Bestow USDC Vault", "bUSDC", treasury],
        { initializer: "initialize", kind: "uups" }
    );
    await usdcVault.waitForDeployment();
    console.log("Vault (USDC):  ", await usdcVault.getAddress());

    // 4. Deploy EURC Vault (UUPS Proxy)
    const eurcVault = await upgrades.deployProxy(
        VaultFactory,
        [await eurc.getAddress(), "Bestow EURC Vault", "bEURC", treasury],
        { initializer: "initialize", kind: "uups" }
    );
    await eurcVault.waitForDeployment();
    console.log("Vault (EURC):  ", await eurcVault.getAddress());

    // 5. Wire the vault into the Hub
    await hub.setCampaignVault(await usdcVault.getAddress());
    console.log("Vault linked to Hub ✅");

    // Save these addresses — you'll need them for .env.local
    console.log("\n--- COPY THESE INTO web/.env.local ---");
    console.log(`NEXT_PUBLIC_HUB_ADDRESS=${await hub.getAddress()}`);
    console.log(`NEXT_PUBLIC_USDC_VAULT=${await usdcVault.getAddress()}`);
    console.log(`NEXT_PUBLIC_EURC_VAULT=${await eurcVault.getAddress()}`);
    console.log(`NEXT_PUBLIC_EURC_TOKEN=${await eurc.getAddress()}`);
}

main().catch((err) => { console.error(err); process.exit(1); });
