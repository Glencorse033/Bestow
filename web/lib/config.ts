// web/lib/config.ts

export const NETWORKS = {
    ARC: {
        chainId: process.env.NEXT_PUBLIC_ARC_CHAIN_ID || '0x4cefa2',
        name: 'ARC Testnet',
        currency: { name: 'USDC', symbol: 'USDC', decimals: 18 },
        rpc: process.env.NEXT_PUBLIC_ARC_RPC || 'https://testnet-rpc.arc.io',
        explorer: process.env.NEXT_PUBLIC_ARC_EXPLORER || 'https://testnet-explorer.arc.io'
    }
};

export const VAULTS = [
    {
        id: 'pool-arc-usdc',
        network: 'ARC',
        name: 'USDC Yield Alpha',
        apy: '12.5%',
        tvl: '$1.2M',
        asset: 'USDC',
        risk: 'Low',
        address: process.env.NEXT_PUBLIC_BESTOW_VAULT_ADDRESS || '0x3600000000000000000000000000000000000000'
    },
    {
        id: 'pool-arc-eurc',
        network: 'ARC',
        name: 'Euro Stable Yield',
        apy: '4.2%',
        tvl: '$840K',
        asset: 'EURC',
        risk: 'Medium',
        address: process.env.NEXT_PUBLIC_BESTOW_EURC_VAULT_ADDRESS || '0x89B50855Aa3bE2F677cD6303Cec089B5F319D72a'
    },
];

export const CONTRACT_ADDRESSES = {
    BESTOW_HUB: process.env.NEXT_PUBLIC_BESTOW_HUB_ADDRESS || '0x0000000000000000000000000000000000000000',
    BESTOW_VAULT: process.env.NEXT_PUBLIC_BESTOW_VAULT_ADDRESS || '0x3600000000000000000000000000000000000000'
};
