// lib/mockContracts.ts

// Database in localStorage key
const DB_KEY = 'bestow_simulation_db';

interface UserState {
    balances: Record<string, number>; // Mock balances keyed by asset symbol (USDC, EURC, etc.)
    vaultDeposits: Record<string, { // Keyed by vaultId
        amount: number;
        timestamp: number;
        lastClaim: number;
    }>;
    campaigns: any[];
}

const INITIAL_STATE: UserState = {
    balances: {
        'USDC': 10000,
        'EURC': 5000,
        'USYC': 2000
    },
    vaultDeposits: {},
    campaigns: []
};

// Helper to get/set state
const getState = (): UserState => {
    if (typeof window === 'undefined') return INITIAL_STATE;
    const stored = localStorage.getItem(DB_KEY);
    if (!stored) return INITIAL_STATE;

    // Migration: if old state had 'balance' instead of 'balances', convert it
    const parsed = JSON.parse(stored);
    if (parsed.balance !== undefined && !parsed.balances) {
        parsed.balances = { 'USDC': parsed.balance, 'EURC': 5000, 'USYC': 2000 };
        delete parsed.balance;
    }
    return parsed;
};

const setState = (state: UserState) => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(DB_KEY, JSON.stringify(state));
};

// BestowVault Simulation
export const BestowVault = {
    APY: 12.5, // Default base APY
    LOCKUP_SECONDS: 20,

    // Helper to get specific vault state or init it
    getVaultState: (state: UserState, vaultId: string) => {
        if (!state.vaultDeposits[vaultId]) {
            state.vaultDeposits[vaultId] = { amount: 0, timestamp: 0, lastClaim: 0 };
        }
        return state.vaultDeposits[vaultId];
    },

    deposit: async (vaultId: string, amount: number, asset: string) => {
        await new Promise(r => setTimeout(r, 1000));
        const state = getState();
        const vault = BestowVault.getVaultState(state, vaultId);
        const currentBalance = state.balances[asset] || 0;

        if (currentBalance < amount) throw new Error(`Insufficient ${asset} Balance`);

        // Claim existing yield first
        const pending = BestowVault.calculateYield(vaultId);

        state.balances[asset] = currentBalance - amount;
        state.balances[asset] += pending;

        vault.amount += amount;
        vault.timestamp = Date.now();
        vault.lastClaim = Date.now();

        setState(state);
        return true;
    },

    withdraw: async (vaultId: string, amount: number, asset: string) => {
        await new Promise(r => setTimeout(r, 1000));
        const state = getState();
        const vault = BestowVault.getVaultState(state, vaultId);

        if (vault.amount < amount) throw new Error("Insufficient Vault Balance");

        const unlockTime = vault.timestamp + (BestowVault.LOCKUP_SECONDS * 1000);
        if (Date.now() < unlockTime) {
            const remaining = Math.ceil((unlockTime - Date.now()) / 1000);
            throw new Error(`Funds locked for ${remaining} more seconds`);
        }

        const pending = BestowVault.calculateYield(vaultId);

        vault.amount -= amount;
        state.balances[asset] = (state.balances[asset] || 0) + amount + pending;
        vault.lastClaim = Date.now();

        setState(state);
        return true;
    },

    getCurrentAPY: (vaultId: string, baseApy: number): number => {
        const state = getState();
        const vault = state.vaultDeposits[vaultId];
        if (!vault || vault.amount === 0) return baseApy;

        const timeElapsedSeconds = (Date.now() - vault.timestamp) / 1000;

        // Tier 3: 90+ days (7,776,000s) -> 20%
        if (timeElapsedSeconds >= 90 * 24 * 3600) return 20;
        // Tier 2: 30-89 days (2,592,000s) -> 15%
        if (timeElapsedSeconds >= 30 * 24 * 3600) return 15;

        // Tier 1: Base APY
        return baseApy;
    },

    calculateYield: (vaultId: string, apy: number = 12.5): number => {
        const state = getState();
        const vault = state.vaultDeposits[vaultId];
        if (!vault || vault.amount === 0) return 0;

        const timeElapsedSeconds = (Date.now() - vault.lastClaim) / 1000;
        const currentApy = BestowVault.getCurrentAPY(vaultId, apy);

        const ratePerSecond = (currentApy / 100) / (365 * 24 * 3600);
        return vault.amount * ratePerSecond * timeElapsedSeconds;
    },

    getUserData: (vaultId: string, asset: string, apy: number = 12.5) => {
        const state = getState();
        return {
            balance: state.balances[asset] || 0,
            deposit: state.vaultDeposits[vaultId] || { amount: 0, timestamp: 0, lastClaim: 0 },
            yield: BestowVault.calculateYield(vaultId, apy),
            currentApy: BestowVault.getCurrentAPY(vaultId, apy)
        };
    }
};

export const BestowHub = {
    createCampaign: async (title: string, goal: number, desc: string, milestones: any[], riskReport: any, image: string) => {
        await new Promise(r => setTimeout(r, 1500));
        const state = getState();
        const newCampaign = {
            id: Date.now(),
            title,
            goal,
            description: desc,
            milestones,     // Track milestones
            riskReport,    // Track verified risk score
            image, // Store image or default
            raised: 0,
            creator: '0x123...mock',
            status: 'ACTIVE'
        };
        state.campaigns.push(newCampaign);
        setState(state);
        return newCampaign;
    },
    getCampaigns: async () => {
        await new Promise(r => setTimeout(r, 500));
        const state = getState();
        return state.campaigns;
    },
    donate: async (campaignId: number, amount: number, platformFee: number, gasFee: number) => {
        await new Promise(r => setTimeout(r, 1000));
        const state = getState();

        const total = amount + platformFee + gasFee;
        if ((state.balances['USDC'] || 0) < total) throw new Error("Insufficient Balance");

        const campaign = state.campaigns.find((c: any) => c.id === campaignId);
        if (!campaign) throw new Error("Campaign not found");

        // Deduct total from user balance
        state.balances['USDC'] = (state.balances['USDC'] || 0) - total;
        // Only add base donation amount to campaign (fees stay in platform)
        campaign.raised += amount;

        setState(state);
        return true;
    }
};
