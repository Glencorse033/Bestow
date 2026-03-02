import { ethers } from 'ethers';

// SECURITY FIX: Silent Mainnet Transaction Risk
export async function enforceNetwork(provider: ethers.BrowserProvider): Promise<void> {
    const network = await provider.getNetwork();
    if (network.chainId !== BigInt(5042002)) {
        try {
            await (window as any).ethereum.request({
                method: 'wallet_switchEthereumChain',
                params: [{ chainId: '0x4CEF52' }], // ARC Testnet Hex
            });
        } catch (switchError: any) {
            if (switchError.code === 4902) {
                await (window as any).ethereum.request({
                    method: 'wallet_addEthereumChain',
                    params: [{
                        chainId: '0x4CEF52',
                        chainName: 'ARC Testnet',
                        nativeCurrency: { name: 'ARC', symbol: 'ARC', decimals: 18 },
                        rpcUrls: ['https://rpc.testnet.arc.network'],
                    }],
                });
            } else {
                throw new Error('Please switch to ARC Testnet to continue.');
            }
        }
    }
}

// Minimal ABIs based on the Solidity files
export const BESTOW_VAULT_ABI = [
    "function deposit() external payable",
    "function deposit(uint256 amount) external", // Legacy ERC20
    "function deposit(uint256 assets, address receiver) external returns (uint256)", // ERC4626
    "function depositNative(address receiver) external payable returns (uint256)", // ERC4626 Native
    "function withdraw(uint256 amount) external", // Legacy
    "function withdraw(uint256 assets, address receiver, address owner) external returns (uint256)", // ERC4626
    "function previewDeposit(uint256 assets) external view returns (uint256)",
    "function convertToShares(uint256 assets) external view returns (uint256)",
    "function convertToAssets(uint256 shares) external view returns (uint256)",
    "function totalAssets() external view returns (uint256)",
    "function getCurrentAPY(address user) public view returns (uint256)",
    "function calculateYield(address user) public view returns (uint256)",
    "function getPosition(address user) external view returns (uint256 amount, uint256 unlockTime, uint256 pendingYield, uint256 currentAPY)",
    "function asset() public view returns (address)",
    "function name() public view returns (string)",
    "function APY() public view returns (uint256)",
    "function totalDeposits() public view returns (uint256)",
    "function paused() public view returns (bool)",
    "function pause() external",
    "function unpause() external",
    "function refillRewards() external payable",
    "function updateParams(uint256 _newAPY, uint256 _newLockup) external",
    // ERC-4626 Admin Functions
    "function distributeRewards(uint256 amount) external",
    "function distributeRewardsNative() external payable",
    "function setFees(uint256 _depositFeeBps, uint256 _withdrawalFeeBps) external",
    "function depositFeeBps() external view returns (uint256)",
    "function withdrawalFeeBps() external view returns (uint256)",
    "event Deposited(address indexed user, uint256 amount)",
    "event Withdrawn(address indexed user, uint256 amount, uint256 yield)"
];

export const BESTOW_HUB_ABI = [
    "function createCampaign(string _title, string _description, string _image, uint256 _target, uint256 _durationInDays, string[] _milestoneDescs, uint256[] _milestonePcts, uint256 _riskScore, string _riskLevel) external",
    "function treasury() external view returns (address)",
    "function platformFeeBps() external view returns (uint256)",
    "function campaignVault() external view returns (address)",
    "function paused() public view returns (bool)",
    "function pause() external",
    "function unpause() external",
    "function setCampaignVault(address _vault) external",
    "event CampaignCreated(address indexed campaignAddress, string title, address indexed creator)",
    "function getCampaigns() external view returns (tuple(address campaignAddress, string title, uint256 target, uint256 deadline, address creator, uint256 riskScore)[])"
];

export const CAMPAIGN_ABI = [
    "function title() view returns (string)",
    "function description() view returns (string)",
    "function image() view returns (string)",
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
    private publicProvider: ethers.JsonRpcProvider | null = null;
    private signer: ethers.Signer | null = null;

    constructor() {
        if (typeof window !== 'undefined') {
            if ((window as any).ethereum) {
                this.provider = new ethers.BrowserProvider((window as any).ethereum);

                // SECURITY FIX: Provider Race Conditions Mid-Session
                (window as any).ethereum.on('accountsChanged', (accounts: string[]) => {
                    if (accounts.length === 0) {
                        this.signer = null;
                        this.provider = null;
                    } else {
                        this.provider = new ethers.BrowserProvider((window as any).ethereum);
                        this.provider.getSigner().then(newSigner => {
                            this.signer = newSigner;
                        });
                    }
                });

                (window as any).ethereum.on('chainChanged', () => {
                    window.location.reload();
                });
            }
            // Use staticNetwork to avoid repeated eth_blockNumber polling which causes rate limiting
            const ARC_CHAIN_ID = parseInt(process.env.NEXT_PUBLIC_ARC_CHAIN_ID || '0x4cef52', 16);
            const rpcUrl = process.env.NEXT_PUBLIC_ARC_RPC || 'https://rpc.testnet.arc.network';
            const arcNetwork = new ethers.Network('arc-testnet', ARC_CHAIN_ID);
            this.publicProvider = new ethers.JsonRpcProvider(rpcUrl, arcNetwork, { staticNetwork: arcNetwork });
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
    async getVaultData(vaultAddress: string, userAddress: string, tokenAddress?: string) {
        const provider = this.publicProvider || this.provider;
        if (!provider) return null;
        const contract = new ethers.Contract(vaultAddress, BESTOW_VAULT_ABI, provider);

        try {
            const [amount, unlockTime, pendingYield, currentAPY] = await contract.getPosition(userAddress);
            const currentBaseAPY = await contract.APY();
            const totalTVL = await contract.totalDeposits();

            let balance;
            let decimals = 18;

            if (tokenAddress) {
                const token = new ethers.Contract(tokenAddress, ERC20_ABI, provider);
                balance = await token.balanceOf(userAddress);
                try {
                    decimals = Number(await token.decimals());
                    console.log(`[Bestow] Token ${tokenAddress} - Balance: ${balance.toString()}, Decimals: ${decimals}`);
                } catch (e) {
                    console.warn("Failed to fetch decimals, defaulting to 18", e);
                }
            } else {
                balance = await provider.getBalance(userAddress);
                console.log(`[Bestow] Native Balance: ${balance.toString()}`);
            }

            return {
                // SECURITY FIX: BigNumber Float Precision Loss
                balance: ethers.formatUnits(balance, decimals),
                deposited: ethers.formatUnits(amount, decimals),
                unlockTime: Number(unlockTime),
                yield: ethers.formatUnits(pendingYield, decimals),
                apy: Number(currentAPY) / 100,
                baseApy: Number(currentBaseAPY) / 100,
                tvl: ethers.formatUnits(totalTVL, decimals)
            };
        } catch (error) {
            console.error("Error fetching vault data:", error);
            return null;
        }
    }

    async vaultDeposit(vaultAddress: string, amount: string, tokenAddress?: string) {
        const signer = await this.getSigner();
        if (!signer) throw new Error("Wallet not connected");

        let decimals = 18;
        if (tokenAddress) {
            const token = new ethers.Contract(tokenAddress, ERC20_ABI, signer);
            decimals = Number(await token.decimals());
            const amountWei = ethers.parseUnits(amount, decimals);

            const allowance = await token.allowance(await signer.getAddress(), vaultAddress);

            if (allowance < amountWei) {
                console.log("Approving token...");
                const approveTx = await token.approve(vaultAddress, ethers.MaxUint256);
                await approveTx.wait();
            }

            const vault = new ethers.Contract(vaultAddress, BESTOW_VAULT_ABI, signer);
            // ERC-4626 Standard: deposit(assets, receiver)
            try {
                const tx = await vault.deposit(amountWei, await signer.getAddress());
                return await tx.wait();
            } catch (e) {
                console.warn("4626 Deposit failed, trying legacy...", e);
                const tx = await vault["deposit(uint256)"](amountWei);
                return await tx.wait();
            }
        } else {
            const amountWei = ethers.parseEther(amount);
            const contract = new ethers.Contract(vaultAddress, BESTOW_VAULT_ABI, signer);
            const tx = await contract["deposit()"]({ value: amountWei });
            return await tx.wait();
        }
    }

    async vaultWithdraw(vaultAddress: string, amount: string, tokenAddress?: string) {
        const signer = await this.getSigner();
        if (!signer) throw new Error("Wallet not connected");

        let decimals = 18;
        if (tokenAddress) {
            const token = new ethers.Contract(tokenAddress, ERC20_ABI, signer);
            decimals = Number(await token.decimals());
        }

        const contract = new ethers.Contract(vaultAddress, BESTOW_VAULT_ABI, signer);

        if (tokenAddress) {
            // ERC-4626 Withdraw: withdraw(assets, receiver, owner)
            const tx = await contract.withdraw(ethers.parseUnits(amount, decimals), await signer.getAddress(), await signer.getAddress());
            return await tx.wait();
        } else {
            // Legacy Native Withdraw: withdraw(amount)
            const tx = await contract["withdraw(uint256)"](ethers.parseUnits(amount, decimals));
            return await tx.wait();
        }
    }

    // Crowdfunding Logic
    async getCampaigns(hubAddress: string) {
        const provider = this.publicProvider || this.provider;
        if (!provider) return [];
        const hub = new ethers.Contract(hubAddress, BESTOW_HUB_ABI, provider);
        try {
            const list = await hub.getCampaigns();

            // Enrich with contract-level data (description, image, raised)
            const enriched = await Promise.all(list.map(async (c: any) => {
                const details = await this.getCampaignDetails(c.campaignAddress);
                return {
                    id: c.campaignAddress,
                    campaignAddress: c.campaignAddress,
                    title: c.title,
                    description: details?.description || "",
                    image: details?.image || "",
                    // SECURITY FIX: BigNumber Float Precision Loss
                    goal: ethers.formatEther(c.target),
                    deadline: Number(c.deadline),
                    creator: c.creator,
                    riskScore: Number(c.riskScore),
                    raised: details?.raised || "0",
                    status: Date.now() / 1000 < Number(c.deadline) ? 'ACTIVE' : 'ENDED'
                };
            }));
            return enriched;
        } catch (err) {
            console.error("Error fetching campaigns:", err);
            return [];
        }
    }

    async getCampaignDetails(campaignAddress: string) {
        const provider = this.publicProvider || this.provider;
        if (!provider) return null;
        const campaign = new ethers.Contract(campaignAddress, CAMPAIGN_ABI, provider);
        try {
            // In Ethers v6, .target is a reserved property (the address). 
            // We must use getFunction() to access the target() state variable.
            const targetFn = campaign.getFunction("target");
            const target = await targetFn();
            const description = await campaign.description();
            const image = await campaign.image();

            const totalRaised = await campaign.totalRaised();
            const deadline = await campaign.deadline();
            return {
                title: await campaign.title(),
                description,
                image,
                // SECURITY FIX: BigNumber Float Precision Loss
                goal: ethers.formatEther(target),
                raised: ethers.formatEther(totalRaised),
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
        console.log("Calling Hub at:", hubAddress);
        console.log("Create Campaign Args:", {
            title: data.title,
            desc: data.description,
            imgLength: (data.image || "").length,
            target: data.target,
            duration: data.duration,
            riskScore: data.riskScore,
            riskLevel: data.riskLevel
        });

        const tx = await hub.createCampaign(
            data.title,
            data.description,
            data.image || "",
            ethers.parseEther(data.target.toString()),
            data.duration,
            data.milestones.map((m: any) => m.description),
            data.milestones.map((m: any) => m.offsetPercent),
            data.riskScore || 10,
            data.riskLevel || "Low",
            data.signature,
            data.timestamp,
            { gasLimit: 5000000 } // Manual limit for large images
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

    // ERC-4626 Vault Admin Functions
    async distributeRewards(vaultAddress: string, amount: string, isNative: boolean = false) {
        const signer = await this.getSigner();
        if (!signer) throw new Error("Wallet not connected");

        const vault = new ethers.Contract(vaultAddress, BESTOW_VAULT_ABI, signer);

        if (isNative) {
            // For USDC native deposits
            const tx = await vault.distributeRewardsNative({ value: ethers.parseEther(amount) });
            return await tx.wait();
        } else {
            // For ERC20 (EURC) - need to approve first
            const token = new ethers.Contract(await vault.asset(), ERC20_ABI, signer);
            const decimals = Number(await token.decimals());
            const amountWei = ethers.parseUnits(amount, decimals);

            const allowance = await token.allowance(await signer.getAddress(), vaultAddress);
            if (allowance < amountWei) {
                const approveTx = await token.approve(vaultAddress, ethers.MaxUint256);
                await approveTx.wait();
            }

            const tx = await vault.distributeRewards(amountWei);
            return await tx.wait();
        }
    }

    async setVaultFees(vaultAddress: string, depositFeeBps: number, withdrawalFeeBps: number) {
        const signer = await this.getSigner();
        if (!signer) throw new Error("Wallet not connected");

        const vault = new ethers.Contract(vaultAddress, BESTOW_VAULT_ABI, signer);
        const tx = await vault.setFees(depositFeeBps, withdrawalFeeBps);
        return await tx.wait();
    }
}

export const contractService = new BestowContractService();
