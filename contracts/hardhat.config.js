require("@nomicfoundation/hardhat-toolbox");

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
    solidity: "0.8.20",
    networks: {
        hardhat: {
            chainId: 1337 // Standard local chain ID
        },
        // Add ARC Testnet later
        arc_testnet: {
            url: "https://testnet-rpc.arc.io", // Placeholder, check docs
            chainId: 5042002,
            // accounts: [PRIVATE_KEY] 
        }
    }
};
