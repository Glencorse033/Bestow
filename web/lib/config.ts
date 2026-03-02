// web/lib/config.ts

export const NETWORKS = {
    ARC: {
        chainId: process.env.NEXT_PUBLIC_ARC_CHAIN_ID || '0x4cef52',
        name: 'ARC Testnet',
        currency: { name: 'USDC', symbol: 'USDC', decimals: 18 },
        rpc: process.env.NEXT_PUBLIC_ARC_RPC || 'https://rpc.testnet.arc.network',
        explorer: process.env.NEXT_PUBLIC_ARC_EXPLORER || 'https://testnet.arcscan.app'
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
        type: 'native',
        address: process.env.NEXT_PUBLIC_BESTOW_VAULT_ADDRESS || '0x09C2390Ea8c12eD8e6239a7e2EC2aA62fef11A47'
    },
    {
        id: 'pool-arc-eurc',
        network: 'ARC',
        name: 'Euro Stable Yield',
        apy: '4.2%',
        tvl: '$840K',
        asset: 'EURC',
        risk: 'Medium',
        type: 'erc20',
        address: process.env.NEXT_PUBLIC_BESTOW_EURC_VAULT_ADDRESS || '0x42AD3Dafe99ce0D6F17C0697f07D6342790f1aBe',
        tokenAddress: process.env.NEXT_PUBLIC_BESTOW_EURC_TOKEN_ADDRESS || '0x89B50855Aa3bE2F677cD6303Cec089B5F319D72a'
    },
];

export const CONTRACT_ADDRESSES = {
    BESTOW_HUB: process.env.NEXT_PUBLIC_BESTOW_HUB_ADDRESS || '0x019F2aA68C268aCBdf42A0c044DC694e35ECe3Cf',
    BESTOW_VAULT: process.env.NEXT_PUBLIC_BESTOW_VAULT_ADDRESS || '0x09C2390Ea8c12eD8e6239a7e2EC2aA62fef11A47',
    BESTOW_EURC_VAULT: process.env.NEXT_PUBLIC_BESTOW_EURC_VAULT_ADDRESS || '0x42AD3Dafe99ce0D6F17C0697f07D6342790f1aBe',
    BESTOW_EURC_TOKEN: process.env.NEXT_PUBLIC_BESTOW_EURC_TOKEN_ADDRESS || '0x89B50855Aa3bE2F677cD6303Cec089B5F319D72a'
};
