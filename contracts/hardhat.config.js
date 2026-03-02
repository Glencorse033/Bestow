require("@nomicfoundation/hardhat-toolbox");
require("@openzeppelin/hardhat-upgrades");
require("dotenv").config();

module.exports = {
    solidity: {
        version: "0.8.24", // Using 0.8.24 to support Cancun EVM efficiently
        settings: {
            evmVersion: "cancun",  // ⚠️ CRITICAL — required for ReentrancyGuardTransient
            viaIR: true, // Prevents Stack Too Deep
            optimizer: { enabled: true, runs: 200 }
        }
    },
    networks: {
        arcTestnet: {
            url: "https://rpc.testnet.arc.network",
            chainId: 5042002,
            accounts: [process.env.DEPLOYER_PRIVATE_KEY]
        }
    },
    etherscan: {
        apiKey: {
            arcTestnet: process.env.ARCSCAN_API_KEY || "placeholder"
        },
        customChains: [
            {
                network: "arcTestnet",
                chainId: 5042002,
                urls: {
                    apiURL: "https://testnet.arcscan.app/api",
                    browserURL: "https://testnet.arcscan.app"
                }
            }
        ]
    }
};
