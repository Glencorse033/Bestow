'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { NETWORKS } from '../lib/config';

interface NavbarProps {
    theme: string;
    toggleTheme: () => void;
}

export default function Navbar({ theme, toggleTheme }: NavbarProps) {
    const [walletAddress, setWalletAddress] = useState<string | null>(null);
    const [currentNetwork, setCurrentNetwork] = useState<string>('ARC');
    const [showWalletMenu, setShowWalletMenu] = useState(false);

    // Sync UI with actual MetaMask state
    useEffect(() => {
        if (typeof window !== 'undefined' && (window as any).ethereum) {
            const ethereum = (window as any).ethereum;

            // Initial state
            ethereum.request({ method: 'eth_accounts' }).then((accounts: string[]) => {
                if (accounts.length > 0) setWalletAddress(accounts[0]);
            });

            ethereum.request({ method: 'eth_chainId' }).then((chainId: string) => {
                const networkKey = Object.keys(NETWORKS).find(key => NETWORKS[key as keyof typeof NETWORKS].chainId.toLowerCase() === chainId.toLowerCase());
                if (networkKey) setCurrentNetwork(networkKey);
            });

            // Listeners
            const handleAccounts = (accounts: string[]) => {
                setWalletAddress(accounts.length > 0 ? accounts[0] : null);
            };

            const handleChain = (chainId: string) => {
                const networkKey = Object.keys(NETWORKS).find(key => NETWORKS[key as keyof typeof NETWORKS].chainId.toLowerCase() === chainId.toLowerCase());
                if (networkKey) setCurrentNetwork(networkKey);
                else setCurrentNetwork('Unknown');
            };

            ethereum.on('accountsChanged', handleAccounts);
            ethereum.on('chainChanged', handleChain);

            // Click outside to close menu
            const handleClickOutside = () => setShowWalletMenu(false);
            window.addEventListener('click', handleClickOutside);

            return () => {
                ethereum.removeListener('accountsChanged', handleAccounts);
                ethereum.removeListener('chainChanged', handleChain);
                window.removeEventListener('click', handleClickOutside);
            };
        }
    }, []);

    const switchNetwork = async (networkKey: keyof typeof NETWORKS) => {
        // ... (Switch network remains same)
        if (typeof window !== 'undefined' && (window as any).ethereum) {
            const ethereum = (window as any).ethereum;
            try {
                await ethereum.request({
                    method: 'wallet_switchEthereumChain',
                    params: [{ chainId: NETWORKS[networkKey].chainId }],
                });
            } catch (error: any) {
                if (error.code === 4902) {
                    try {
                        await ethereum.request({
                            method: 'wallet_addEthereumChain',
                            params: [{
                                chainId: NETWORKS[networkKey].chainId,
                                chainName: NETWORKS[networkKey].name,
                                nativeCurrency: NETWORKS[networkKey].currency,
                                rpcUrls: [NETWORKS[networkKey].rpc],
                                blockExplorerUrls: [NETWORKS[networkKey].explorer]
                            }],
                        });
                    } catch (addError) {
                        console.error("Failed to add network", addError);
                    }
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

    const disconnectWallet = (e: React.MouseEvent) => {
        e.stopPropagation();
        setWalletAddress(null);
        setShowWalletMenu(false);
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
            {/* Logo Section */}
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

            {/* Nav Links */}
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

            {/* Right Side Actions */}
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center', position: 'relative' }}>
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
                    onClick={() => switchNetwork('ARC')}
                >
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--accent)', boxShadow: '0 0 8px var(--accent)' }}></div>
                    <span style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--accent)', letterSpacing: '0.05em' }}>
                        {currentNetwork === 'Unknown' ? 'WRONG NET' : currentNetwork}
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

                {/* Wallet Button Container */}
                <div style={{ position: 'relative' }} onClick={(e) => e.stopPropagation()}>
                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => walletAddress ? setShowWalletMenu(!showWalletMenu) : connectWallet()}
                        style={{
                            background: '#0f172a',
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

                    {/* Disconnect Menu */}
                    {showWalletMenu && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            style={{
                                position: 'absolute',
                                top: '54px',
                                right: 0,
                                width: '100%',
                                background: '#0f172a',
                                border: '1px solid var(--border)',
                                borderRadius: '12px',
                                padding: '8px',
                                zIndex: 110,
                                boxShadow: '0 10px 25px rgba(0,0,0,0.5)'
                            }}
                        >
                            <button
                                onClick={disconnectWallet}
                                style={{
                                    width: '100%',
                                    padding: '12px',
                                    background: 'none',
                                    border: 'none',
                                    color: '#ef4444',
                                    fontWeight: 700,
                                    textAlign: 'left',
                                    cursor: 'pointer',
                                    borderRadius: '8px',
                                    fontSize: '0.9rem',
                                    transition: 'background 0.2s'
                                }}
                                onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)')}
                                onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}
                            >
                                Sign Out
                            </button>
                        </motion.div>
                    )}
                </div>
            </div>
        </nav>
    );
}
