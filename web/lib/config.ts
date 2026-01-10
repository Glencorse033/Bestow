// web/lib/config.ts

export const NETWORKS = {
    ARC: {
        chainId: '0x4cefa2', // 5042002
        name: 'ARC Testnet',
        currency: { name: 'USDC', symbol: 'USDC', decimals: 18 },
        rpc: 'https://testnet-rpc.arc.io',
        explorer: 'https://testnet-explorer.arc.io'
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
        address: '0x3600000000000000000000000000000000000000'
    },
    {
        id: 'pool-arc-eurc',
        network: 'ARC',
        name: 'Euro Stable Yield',
        apy: '4.2%',
        tvl: '$840K',
        asset: 'EURC',
        risk: 'Medium',
        address: '0x89B50855Aa3bE2F677cD6303Cec089B5F319D72a'
    },
    {
        id: 'pool-arc-usyc',
        network: 'ARC',
        name: 'Institutional USYC',
        apy: '5.1%',
        tvl: '$3.5M',
        asset: 'USYC',
        risk: 'Low',
        address: '0xe9185F0c5F296Ed1797AaE4238D26CCaBEadb86C'
    }
];
