import { ethers } from 'ethers';

// Minimal ABIs based on the Solidity files
export const BESTOW_VAULT_ABI = [
    "function deposit() external payable",
    "function withdraw(uint256 amount) external",
    "function getCurrentAPY(address user) public view returns (uint256)",
    "function calculateYield(address user) public view returns (uint256)",
    "function getPosition(address user) external view returns (uint256 amount, uint256 unlockTime, uint256 pendingYield, uint256 currentAPY)",
    "function asset() public view returns (string)",
    "function name() public view returns (string)",
    "function APY() public view returns (uint256)",
    "event Deposited(address indexed user, uint256 amount)",
    "event Withdrawn(address indexed user, uint256 amount, uint256 yield)"
];

export const BESTOW_HUB_ABI = [
    "function campaigns(uint256) public view returns (address)",
    "function getCampaigns() public view returns (address[])"
];

export const ERC20_ABI = [
    "function name() view returns (string)",
    "function symbol() view returns (string)",
    "function decimals() view returns (uint8)",
    "function totalSupply() view returns (uint256)",
    "function balanceOf(address owner) view returns (uint256)",
    "function transfer(address to, uint256 amount) returns (bool)",
    "function allowance(address owner, address spender) view returns (uint256)",
    "function approve(address spender, uint256 amount) returns (bool)",
    "function transferFrom(address from, address to, uint256 amount) returns (bool)",
    "event Transfer(address indexed from, address indexed to, uint256 amount)",
    "event Approval(address indexed owner, address indexed spender, uint256 amount)"
];

export class BestowContractService {
    private provider: ethers.BrowserProvider | null = null;
    private signer: ethers.Signer | null = null;

    constructor() {
        if (typeof window !== 'undefined' && (window as any).ethereum) {
            this.provider = new ethers.BrowserProvider((window as any).ethereum);
        }
    }

    async getSigner() {
        if (!this.provider) return null;
        if (!this.signer) {
            this.signer = await this.provider.getSigner();
        }
        return this.signer;
    }

    async getVaultData(vaultAddress: string, userAddress: string) {
        if (!this.provider) return null;
        const contract = new ethers.Contract(vaultAddress, BESTOW_VAULT_ABI, this.provider);

        try {
            const [amount, unlockTime, pendingYield, currentAPY] = await contract.getPosition(userAddress);
            const assetName = await contract.asset();

            // Get user's wallet balance for this asset (assuming native for now based on 'payable')
            const balance = await this.provider.getBalance(userAddress);

            return {
                balance: parseFloat(ethers.formatEther(balance)),
                deposited: parseFloat(ethers.formatEther(amount)),
                unlockTime: Number(unlockTime),
                yield: parseFloat(ethers.formatEther(pendingYield)),
                apy: Number(currentAPY) / 100 // Convert basis points (e.g. 1250 -> 12.5)
            };
        } catch (error) {
            console.error("Error fetching vault data:", error);
            return null;
        }
    }

    async deposit(vaultAddress: string, amount: string) {
        const signer = await this.getSigner();
        if (!signer) throw new Error("Wallet not connected");

        const contract = new ethers.Contract(vaultAddress, BESTOW_VAULT_ABI, signer);
        const tx = await contract.deposit({ value: ethers.parseEther(amount) });
        return await tx.wait();
    }

    async withdraw(vaultAddress: string, amount: string) {
        const signer = await this.getSigner();
        if (!signer) throw new Error("Wallet not connected");

        const contract = new ethers.Contract(vaultAddress, BESTOW_VAULT_ABI, signer);
        const tx = await contract.withdraw(ethers.parseEther(amount));
        return await tx.wait();
    }
}

export const contractService = new BestowContractService();
