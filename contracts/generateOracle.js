const { ethers } = require("ethers");
const wallet = ethers.Wallet.createRandom();
console.log("Oracle Address:     ", wallet.address);
console.log("Oracle Private Key: ", wallet.privateKey);
