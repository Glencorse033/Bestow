require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

const PRIVATE_KEY = process.env.PRIVATE_KEY || "0x0000000000000000000000000000000000000000000000000000000000000000";
const ARC_RPC = process.env.ARC_TESTNET_RPC || "https://testnet-rpc.arc.io";

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
    solidity: "0.8.20",
    networks: {
        hardhat: {
            chainId: 1337
        },
        arc_testnet: {
            url: ARC_RPC,
            chainId: 5042002,
            accounts: [PRIVATE_KEY]
        }
    }
};
