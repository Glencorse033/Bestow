'use client';

import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { BestowVault } from '../../lib/mockContracts';
import { VAULTS } from '../../lib/config';

export default function VaultPage() {
    const [selectedVault, setSelectedVault] = useState<any | null>(null);
    const [actionType, setActionType] = useState<'deposit' | 'withdraw' | null>(null);

    return (
        <div className="container" style={{ paddingTop: '80px', paddingBottom: '80px' }}>
            <div style={{ marginBottom: '60px', textAlign: 'center' }}>
                <h1 style={{ fontSize: '3rem', marginBottom: '16px' }}>Yield Vaults</h1>
                <p style={{ color: 'var(--text-secondary)', fontSize: '1.2rem' }}>
                    Institutional-grade yield opportunities powered by the ARC Network.
                </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '32px' }}>
                {VAULTS.map((vault, i) => (
                    <VaultCard
                        key={i}
                        vault={vault}
                        index={i}
                        onAction={(type) => {
                            setSelectedVault(vault);
                            setActionType(type);
                        }}
                    />
                ))}
            </div>

            <VaultModal
                vault={selectedVault}
                action={actionType}
                onClose={() => {
                    setSelectedVault(null);
                    setActionType(null);
                }}
            />
        </div>
    );
}

// Separate Modal Component
function VaultModal({ vault, action, onClose }: { vault: any, action: 'deposit' | 'withdraw' | null, onClose: () => void }) {
    const [amount, setAmount] = useState('');
    const [loading, setLoading] = useState(false);
    const [userData, setUserData] = useState<any>(null); // To check balance limit

    useEffect(() => {
        if (vault) {
            setAmount('');
            const apyValue = parseFloat(vault.apy) || 12.5;
            setUserData(BestowVault.getUserData(vault.id, vault.asset, apyValue));
        }
    }, [vault, action]);

    if (!vault || !action) return null;

    const balance = userData?.balance || 0;
    const deposited = userData?.deposit.amount || 0;
    const max = action === 'deposit' ? balance : deposited;
    const enteredAmount = parseFloat(amount) || 0;
    const isValid = enteredAmount > 0 && enteredAmount <= max;

    const handleExecute = async () => {
        if (!isValid) return;
        setLoading(true);
        try {
            if (action === 'deposit') {
                await BestowVault.deposit(vault.id, enteredAmount, vault.asset);
            } else {
                await BestowVault.withdraw(vault.id, enteredAmount, vault.asset);
            }
            onClose();
        } catch (err) {
            alert((err as any).message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{
            position: 'fixed', inset: 0, zIndex: 1000,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            backdropFilter: 'blur(8px)', background: 'rgba(0,0,0,0.6)'
        }}>
            <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="glass-panel"
                style={{ width: '100%', maxWidth: '450px', padding: '32px', position: 'relative', background: '#0f172a' }}
            >
                <h2 style={{ marginBottom: '8px', textTransform: 'capitalize' }}>{action} {vault.asset}</h2>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>
                    {action === 'deposit' ? 'Add funds to earn yield.' : 'Withdraw principal and interest.'}
                </p>

                <div style={{ background: 'var(--bg-secondary)', padding: '16px', borderRadius: '12px', marginBottom: '24px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.9rem' }}>
                        <span style={{ color: 'var(--text-secondary)' }}>Available to {action}:</span>
                        <span style={{ fontWeight: 600 }}>{max.toFixed(2)} {vault.asset}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <input
                            type="number"
                            autoFocus
                            placeholder="0.00"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            style={{
                                width: '100%', background: 'none', border: 'none',
                                color: 'var(--text-primary)', fontSize: '2rem', fontWeight: 700, outline: 'none'
                            }}
                        />
                        <button
                            onClick={() => setAmount(max.toString())}
                            style={{
                                padding: '4px 12px', borderRadius: '6px',
                                background: 'rgba(255,255,255,0.1)', border: 'none',
                                color: 'var(--accent)', cursor: 'pointer', fontWeight: 600
                            }}
                        >
                            MAX
                        </button>
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <button
                        onClick={onClose}
                        className="glass-panel"
                        style={{ padding: '16px', cursor: 'pointer', display: 'flex', justifyContent: 'center' }}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleExecute}
                        disabled={!isValid || loading}
                        className="btn-primary"
                        style={{ padding: '16px', opacity: (!isValid || loading) ? 0.5 : 1, display: 'flex', justifyContent: 'center' }}
                    >
                        {loading ? 'Processing...' : 'Confirm'}
                    </button>
                </div>
            </motion.div>
        </div>
    );
}

function VaultCard({ vault, index, onAction }: { vault: any, index: number, onAction: (t: 'deposit' | 'withdraw') => void }) {
    const [userData, setUserData] = useState<any>(null);
    const [isConnected, setIsConnected] = useState(false);

    // Check wallet connection and fetch data
    useEffect(() => {
        const checkConnection = async () => {
            if (typeof window !== 'undefined' && (window as any).ethereum) {
                try {
                    const accounts = await (window as any).ethereum.request({ method: 'eth_accounts' });
                    setIsConnected(accounts.length > 0);
                } catch {
                    setIsConnected(false);
                }
            }
        };

        checkConnection();

        // Listen for account changes
        if (typeof window !== 'undefined' && (window as any).ethereum) {
            const handleAccounts = (accounts: string[]) => {
                setIsConnected(accounts.length > 0);
            };
            (window as any).ethereum.on('accountsChanged', handleAccounts);
            return () => {
                (window as any).ethereum?.removeListener('accountsChanged', handleAccounts);
            };
        }
    }, []);

    // Only fetch user data if connected
    useEffect(() => {
        if (!isConnected) {
            setUserData(null);
            return;
        }

        const interval = setInterval(() => {
            // Parse APY from vault config (e.g., "12.5%" -> 12.5)
            const apyValue = parseFloat(vault.apy) || 12.5;
            const data = BestowVault.getUserData(vault.id, vault.asset, apyValue);
            setUserData(data);
        }, 1000);
        return () => clearInterval(interval);
    }, [vault.id, vault.asset, isConnected]);

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="glass-panel"
            style={{ padding: '32px', position: 'relative', overflow: 'hidden' }}
        >
            <div style={{
                position: 'absolute',
                top: '16px',
                right: '16px',
                background: 'var(--bg-secondary)',
                padding: '4px 12px',
                borderRadius: '99px',
                fontSize: '0.8rem',
                fontWeight: 700
            }}>
                {vault.network}
            </div>

            <div style={{ marginBottom: '24px' }}>
                <h3 style={{ fontSize: '1.5rem', marginBottom: '8px' }}>{vault.name}</h3>
                <p style={{ color: 'var(--accent)', fontSize: '1.1rem', fontWeight: 600 }}>{vault.asset}</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '32px' }}>
                <div>
                    <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>APY</p>
                    <p style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--accent)' }}>{vault.apy}</p>
                </div>
                <div>
                    <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>TVL</p>
                    <p style={{ fontSize: '1.5rem', fontWeight: 700 }}>{vault.tvl}</p>
                </div>
            </div>

            {/* User Data - Always show, but with 0 values when not connected */}
            <div style={{ marginBottom: '24px', padding: '16px', background: 'rgba(255,255,255,0.05)', borderRadius: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Your Balance:</span>
                    <span style={{ fontWeight: 700 }}>{isConnected && userData ? userData.balance.toFixed(2) : '0.00'} {vault.asset}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Deposited:</span>
                    <span style={{ fontWeight: 700, color: 'var(--accent)' }}>{isConnected && userData ? userData.deposit.amount.toFixed(2) : '0.00'} {vault.asset}</span>
                </div>
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
                <button
                    onClick={() => onAction('deposit')}
                    className="btn-primary"
                    style={{ flex: 1 }}
                >
                    Deposit
                </button>
                <button
                    onClick={() => onAction('withdraw')}
                    className="glass-panel"
                    style={{ flex: 1, border: '1px solid var(--border)', cursor: 'pointer' }}
                >
                    Withdraw
                </button>
            </div>
        </motion.div>
    );
}

