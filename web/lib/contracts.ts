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
    "function paused() public view returns (bool)",
    "function pause() external",
    "function unpause() external",
    "function refillRewards() external payable",
    "function updateParams(uint256 _newAPY, uint256 _newLockup) external",
    "event Deposited(address indexed user, uint256 amount)",
    "event Withdrawn(address indexed user, uint256 amount, uint256 yield)"
];

export const BESTOW_HUB_ABI = [
    "function createCampaign(string _title, string _description, uint256 _target, uint256 _durationInDays, string[] _milestoneDescs, uint256[] _milestonePcts, uint256 _riskScore, string _riskLevel) external",
    "function treasury() external view returns (address)",
    "function platformFeeBps() external view returns (uint256)",
    "function campaignVault() external view returns (address)",
    "function paused() public view returns (bool)",
    "function pause() external",
    "function unpause() external",
    "function setCampaignVault(address _vault) external",
    "event CampaignCreated(address indexed campaignAddress, string title, address indexed creator)"
];

export const CAMPAIGN_ABI = [
    "function title() view returns (string)",
    "function description() view returns (string)",
    "function target() view returns (uint256)",
    "function deadline() view returns (uint256)",
    "function creator() view returns (address)",
    "function totalRaised() view returns (uint256)",
    "function totalClaimed() view returns (uint256)",
    "function claimed() view returns (bool)",
    "function inVault() view returns (bool)",
    "function donate() external payable",
    "function withdraw() external",
    "function completeMilestone(uint256 index) external",
    "function activateEscrowYield() external",
    "function milestones(uint256 index) view returns (string description, uint256 offsetPercent, bool completed)",
    "function getEstimatedYield(address contributor) view returns (uint256)",
    "function paused() public view returns (bool)",
    "event DonationReceived(address indexed donor, uint256 amount)",
    "event FundsWithdrawn(address indexed creator, uint256 amount)"
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
        if (typeof window === 'undefined' || !(window as any).ethereum) return null;
        if (!this.provider) {
            this.provider = new ethers.BrowserProvider((window as any).ethereum);
        }
        try {
            this.signer = await this.provider.getSigner();
            return this.signer;
        } catch (e) {
            console.error("Failed to get signer:", e);
            return null;
        }
    }

    // Vault Logic
    async getVaultData(vaultAddress: string, userAddress: string) {
        if (!this.provider) return null;
        const contract = new ethers.Contract(vaultAddress, BESTOW_VAULT_ABI, this.provider);

        try {
            const [amount, unlockTime, pendingYield, currentAPY] = await contract.getPosition(userAddress);
            const balance = await this.provider.getBalance(userAddress);

            return {
                balance: parseFloat(ethers.formatEther(balance)),
                deposited: parseFloat(ethers.formatEther(amount)),
                unlockTime: Number(unlockTime),
                yield: parseFloat(ethers.formatEther(pendingYield)),
                apy: Number(currentAPY) / 100
            };
        } catch (error) {
            console.error("Error fetching vault data:", error);
            return null;
        }
    }

    async vaultDeposit(vaultAddress: string, amount: string) {
        const signer = await this.getSigner();
        if (!signer) throw new Error("Wallet not connected");

        const contract = new ethers.Contract(vaultAddress, BESTOW_VAULT_ABI, signer);
        const tx = await contract.deposit({ value: ethers.parseEther(amount) });
        return await tx.wait();
    }

    async vaultWithdraw(vaultAddress: string, amount: string) {
        const signer = await this.getSigner();
        if (!signer) throw new Error("Wallet not connected");

        const contract = new ethers.Contract(vaultAddress, BESTOW_VAULT_ABI, signer);
        const tx = await contract.withdraw(ethers.parseEther(amount));
        return await tx.wait();
    }

    // Crowdfunding Logic
    async getCampaigns(hubAddress: string) {
        if (!this.provider) return [];
        const hub = new ethers.Contract(hubAddress, BESTOW_HUB_ABI, this.provider);
        try {
            const list = await hub.getCampaigns();
            return list.map((c: any) => ({
                id: c.campaignAddress, // Use address as ID
                campaignAddress: c.campaignAddress,
                title: c.title,
                description: c.description,
                goal: parseFloat(ethers.formatEther(c.target)),
                deadline: Number(c.deadline),
                creator: c.creator,
                riskScore: Number(c.riskScore),
                raised: 0, // Need to fetch per campaign or update ABI to include it
                status: Date.now() / 1000 < Number(c.deadline) ? 'ACTIVE' : 'ENDED'
            }));
        } catch (e) {
            console.error("Error fetching campaigns:", e);
            return [];
        }
    }

    async getCampaignDetails(campaignAddress: string) {
        if (!this.provider) return null;
        const campaign = new ethers.Contract(campaignAddress, CAMPAIGN_ABI, this.provider) as any;
        try {
            const target = await campaign.target();
            const totalRaised = await campaign.totalRaised();
            const deadline = await campaign.deadline();
            return {
                goal: parseFloat(ethers.formatEther(target)),
                raised: parseFloat(ethers.formatEther(totalRaised)),
                deadline: Number(deadline)
            };
        } catch (e) {
            console.error("Error fetching campaign details:", e);
            return null;
        }
    }

    async createCampaign(hubAddress: string, data: any) {
        const signer = await this.getSigner();
        if (!signer) throw new Error("Wallet not connected");

        const hub = new ethers.Contract(hubAddress, BESTOW_HUB_ABI, signer);
        const tx = await hub.createCampaign(
            data.title,
            data.description,
            ethers.parseEther(data.target.toString()),
            data.duration,
            data.milestones.map((m: any) => m.description),
            data.milestones.map((m: any) => m.offsetPercent),
            data.riskScore || 10,
            data.riskLevel || "Low"
        );
        return await tx.wait();
    }

    async donate(campaignAddress: string, amount: string) {
        const signer = await this.getSigner();
        if (!signer) throw new Error("Wallet not connected");

        const campaign = new ethers.Contract(campaignAddress, CAMPAIGN_ABI, signer);
        const tx = await campaign.donate({ value: ethers.parseEther(amount) });
        return await tx.wait();
    }

    async completeMilestone(campaignAddress: string, index: number) {
        const signer = await this.getSigner();
        if (!signer) throw new Error("Wallet not connected");

        const campaign = new ethers.Contract(campaignAddress, CAMPAIGN_ABI, signer);
        const tx = await campaign.completeMilestone(index);
        return await tx.wait();
    }

    async togglePause(contractAddress: string, type: 'HUB' | 'VAULT') {
        const signer = await this.getSigner();
        if (!signer) throw new Error("Wallet not connected");

        const abi = type === 'HUB' ? BESTOW_HUB_ABI : BESTOW_VAULT_ABI;
        const contract = new ethers.Contract(contractAddress, abi, signer);

        const isPaused = await contract.paused();
        const tx = isPaused ? await contract.unpause() : await contract.pause();
        return await tx.wait();
    }

    async activateEscrowYield(campaignAddress: string) {
        const signer = await this.getSigner();
        if (!signer) throw new Error("Wallet not connected");

        const campaign = new ethers.Contract(campaignAddress, CAMPAIGN_ABI, signer);
        const tx = await campaign.activateEscrowYield();
        return await tx.wait();
    }

    async setCampaignVault(hubAddress: string, vaultAddress: string) {
        const signer = await this.getSigner();
        if (!signer) throw new Error("Wallet not connected");

        const hub = new ethers.Contract(hubAddress, BESTOW_HUB_ABI, signer);
        const tx = await hub.setCampaignVault(vaultAddress);
        return await tx.wait();
    }

    async refillVaultRewards(vaultAddress: string, amount: string) {
        const signer = await this.getSigner();
        if (!signer) throw new Error("Wallet not connected");

        const vault = new ethers.Contract(vaultAddress, BESTOW_VAULT_ABI, signer);
        const tx = await vault.refillRewards({ value: ethers.parseEther(amount) });
        return await tx.wait();
    }

    async updateVaultParams(vaultAddress: string, apy: number, lockup: number) {
        const signer = await this.getSigner();
        if (!signer) throw new Error("Wallet not connected");

        const vault = new ethers.Contract(vaultAddress, BESTOW_VAULT_ABI, signer);
        const tx = await vault.updateParams(apy, lockup);
        return await tx.wait();
    }
}

export const contractService = new BestowContractService();
