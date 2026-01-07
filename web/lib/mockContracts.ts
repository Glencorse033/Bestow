// lib/mockContracts.ts

// Database in localStorage key
const DB_KEY = 'bestow_simulation_db';

interface UserState {
    balance: number; // Mock USDC balance
    vaultDeposits: Record<string, { // Keyed by vaultId
        amount: number;
        timestamp: number;
        lastClaim: number;
    }>;
    campaigns: any[];
}

const INITIAL_STATE: UserState = {
    balance: 10000,
    vaultDeposits: {},
    campaigns: []
};

// Helper to get/set state
const getState = (): UserState => {
    if (typeof window === 'undefined') return INITIAL_STATE;
    const stored = localStorage.getItem(DB_KEY);
    return stored ? JSON.parse(stored) : INITIAL_STATE;
};

const setState = (state: UserState) => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(DB_KEY, JSON.stringify(state));
};

// BestowVault Simulation
export const BestowVault = {
    APY: 12.5, // 12.5%
    LOCKUP_SECONDS: 20,

    // Helper to get specific vault state or init it
    getVaultState: (state: UserState, vaultId: string) => {
        if (!state.vaultDeposits[vaultId]) {
            state.vaultDeposits[vaultId] = { amount: 0, timestamp: 0, lastClaim: 0 };
        }
        return state.vaultDeposits[vaultId];
    },

    deposit: async (vaultId: string, amount: number) => {
        await new Promise(r => setTimeout(r, 1000));
        const state = getState();
        const vault = BestowVault.getVaultState(state, vaultId);

        if (state.balance < amount) throw new Error("Insufficient Balance");

        // Claim existing yield first
        const pending = BestowVault.calculateYield(vaultId);

        state.balance -= amount;
        state.balance += pending;

        vault.amount += amount;
        vault.timestamp = Date.now();
        vault.lastClaim = Date.now();

        setState(state);
        return true;
    },

    withdraw: async (vaultId: string, amount: number) => {
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
        state.balance += amount;
        state.balance += pending;
        vault.lastClaim = Date.now();

        setState(state);
        return true;
    },

    calculateYield: (vaultId: string): number => {
        const state = getState();
        const vault = state.vaultDeposits[vaultId];
        if (!vault || vault.amount === 0) return 0;

        const timeElapsedSeconds = (Date.now() - vault.lastClaim) / 1000;
        const ratePerSecond = 0.125 / (365 * 24 * 3600);
        return vault.amount * ratePerSecond * timeElapsedSeconds;
    },

    getUserData: (vaultId: string) => {
        const state = getState();
        // Return structured data for simple consumption
        return {
            balance: state.balance,
            deposit: state.vaultDeposits[vaultId] || { amount: 0, timestamp: 0, lastClaim: 0 },
            yield: BestowVault.calculateYield(vaultId)
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
    donate: async (campaignId: number, amount: number) => {
        await new Promise(r => setTimeout(r, 1000));
        const state = getState();

        if (state.balance < amount) throw new Error("Insufficient Balance");

        const campaign = state.campaigns.find((c: any) => c.id === campaignId);
        if (!campaign) throw new Error("Campaign not found");

        state.balance -= amount;
        campaign.raised += amount;

        setState(state);
        return true;
    }
};
