'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';

interface NavbarProps {
    theme: string;
    toggleTheme: () => void;
}

const NETWORKS = {
    ARC: {
        chainId: '0x4cefa2', // 5042002 (Testnet)
        name: 'ARC Testnet',
        currency: 'USDC'
    },
    SONEIUM: {
        chainId: '0x74c', // 1868 (Mainnet)
        name: 'Soneium',
        currency: 'ETH'
    },
    INK: {
        chainId: '0xdef1', // 57073 (Mainnet)
        name: 'Ink',
        currency: 'ETH'
    }
};

export default function Navbar({ theme, toggleTheme }: NavbarProps) {
    const [walletAddress, setWalletAddress] = useState<string | null>(null);
    const [currentNetwork, setCurrentNetwork] = useState<string>('ARC');

    const switchNetwork = async (networkKey: keyof typeof NETWORKS) => {
        if (typeof window !== 'undefined' && (window as any).ethereum) {
            try {
                await (window as any).ethereum.request({
                    method: 'wallet_switchEthereumChain',
                    params: [{ chainId: NETWORKS[networkKey].chainId }],
                });
                setCurrentNetwork(networkKey);
            } catch (error: any) {
                // This error code indicates that the chain has not been added to MetaMask.
                if (error.code === 4902) {
                    alert(`Please add ${NETWORKS[networkKey].name} to your wallet manually first!`);
                }
                console.error("Switch failed", error);
            }
        }
    };

    const connectWallet = async () => {
        if (typeof window !== 'undefined' && (window as any).ethereum) {
            try {
                const accounts = await (window as any).ethereum.request({ method: 'eth_requestAccounts' });
                setWalletAddress(accounts[0]);
            } catch (error) {
                console.error("Connection failed", error);
            }
        } else {
            alert("Please install MetaMask!");
        }
    };

    return (
        <nav className="glass-panel" style={{
            position: 'sticky',
            top: '16px',
            margin: '0 24px',
            padding: '16px 32px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            zIndex: 100
        }}>
            <div className="logo" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                    width: '40px',
                    height: '40px',
                    background: 'var(--accent)',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--bg-primary)',
                    fontSize: '1.5rem',
                    fontWeight: 800
                }}>B</div>
                <Link href="/" style={{ textDecoration: 'none', color: 'var(--text-primary)', fontSize: '1.5rem', fontWeight: 800 }}>
                    bestow
                </Link>
            </div>

            <div style={{ display: 'flex', gap: '32px', alignItems: 'center' }}>
                <Link href="/explore" style={{ textDecoration: 'none', color: 'var(--text-secondary)', fontWeight: 700, letterSpacing: '0.05em', fontSize: '0.9rem' }}>
                    EXPLORE
                </Link>
                <Link href="/launch" style={{ textDecoration: 'none', color: 'var(--text-secondary)', fontWeight: 700, letterSpacing: '0.05em', fontSize: '0.9rem' }}>
                    LAUNCH
                </Link>
                <Link href="/vault" style={{ textDecoration: 'none', color: 'var(--text-secondary)', fontWeight: 700, letterSpacing: '0.05em', fontSize: '0.9rem' }}>
                    VAULT
                </Link>
            </div>

            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                {/* Network Selector Pill */}
                <div style={{
                    background: 'rgba(16, 185, 129, 0.1)',
                    padding: '10px 16px',
                    borderRadius: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    cursor: 'pointer',
                    border: '1px solid var(--accent)',
                    transition: 'all 0.2s ease'
                }}
                    onClick={() => {
                        const next = currentNetwork === 'ARC' ? 'SONEIUM' : currentNetwork === 'SONEIUM' ? 'INK' : 'ARC';
                        switchNetwork(next as keyof typeof NETWORKS);
                    }}
                >
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--accent)', boxShadow: '0 0 8px var(--accent)' }}></div>
                    <span style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--accent)', letterSpacing: '0.05em' }}>
                        {/* Show short name for UI cleanliness */}
                        {currentNetwork}
                    </span>
                    <span style={{ fontSize: '0.7rem', color: 'var(--accent)' }}>▼</span>
                </div>

                {/* Theme Toggle */}
                <button
                    onClick={toggleTheme}
                    style={{
                        width: '44px',
                        height: '44px',
                        borderRadius: '12px',
                        background: 'var(--bg-secondary)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: '1.2rem',
                        color: 'var(--text-primary)'
                    }}
                >
                    {theme === 'dark' ? '☀️' : '🌙'}
                </button>

                {/* Wallet Button */}
                <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={connectWallet}
                    style={{
                        background: '#0f172a', /* Always dark for wallet pill as per screenshot */
                        border: '1px solid var(--border)',
                        borderRadius: '12px',
                        padding: '8px 16px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        color: 'white',
                        fontWeight: 600,
                        cursor: 'pointer',
                        height: '44px'
                    }}
                >
                    {walletAddress ? (
                        <>
                            <span>{`${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`}</span>
                            <div style={{
                                width: '24px',
                                height: '24px',
                                borderRadius: '50%',
                                background: 'linear-gradient(135deg, var(--accent), #3b82f6)',
                                border: '2px solid rgba(255,255,255,0.2)'
                            }}></div>
                        </>
                    ) : (
                        "Connect Wallet"
                    )}
                </motion.button>
            </div>
        </nav>
    );
}
