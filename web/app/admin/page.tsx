'use client';

import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { contractService, CAMPAIGN_ABI } from '../../lib/contracts';
import { CONTRACT_ADDRESSES } from '../../lib/config';
import { Shield, Check, Activity, AlertTriangle, Settings, RefreshCcw, Wallet, Zap, Clock } from 'lucide-react';
import { ethers } from 'ethers';

export default function AdminPage() {
    const [isOwner, setIsOwner] = useState(false);
    const [hubPaused, setHubPaused] = useState(false);
    const [vaultPaused, setVaultPaused] = useState(false);
    const [campaigns, setCampaigns] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState(false);
    const [address, setAddress] = useState<string | null>(null);

    // New Configuration States
    const [newVaultAddress, setNewVaultAddress] = useState('');
    const [currentCampaignVault, setCurrentCampaignVault] = useState('');
    const [refillAmount, setRefillAmount] = useState('');
    const [newAPY, setNewAPY] = useState('');
    const [newLockup, setNewLockup] = useState('');

    const loadData = async () => {
        try {
            setLoading(true);
            const accounts = await (window as any).ethereum.request({ method: 'eth_accounts' });
            if (accounts.length === 0) return;

            setAddress(accounts[0]);

            const provider = (contractService as any).provider;

            // 1. Check Hub Status & Config
            const hub = new ethers.Contract(CONTRACT_ADDRESSES.BESTOW_HUB, [
                "function owner() view returns (address)",
                "function paused() view returns (bool)",
                "function campaignVault() view returns (address)"
            ], provider);

            const owner = await hub.owner();
            setIsOwner(accounts[0].toLowerCase() === owner.toLowerCase());
            setHubPaused(await hub.paused());
            setCurrentCampaignVault(await hub.campaignVault());

            // 2. Check Vault Status
            const vault = new ethers.Contract(CONTRACT_ADDRESSES.BESTOW_VAULT, [
                "function paused() view returns (bool)"
            ], provider);
            setVaultPaused(await vault.paused());

            // 3. Load Campaigns
            const allCampaigns = await contractService.getCampaigns(CONTRACT_ADDRESSES.BESTOW_HUB);
            const enriched = await Promise.all(allCampaigns.map(async (c: any) => {
                const campaign = new ethers.Contract(c.campaignAddress, CAMPAIGN_ABI, provider);
                const milestones = [];
                for (let i = 0; i < 3; i++) {
                    try {
                        const m = await campaign.milestones(i);
                        milestones.push({ description: m[0], offsetPercent: Number(m[1]), completed: m[2], index: i });
                    } catch { break; }
                }
                return { ...c, milestones };
            }));

            setCampaigns(enriched);
        } catch (err) {
            console.error("Failed to load admin data", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const handleSetCampaignVault = async () => {
        if (!ethers.isAddress(newVaultAddress)) return alert("Invalid address");
        try {
            setProcessing(true);
            await contractService.setCampaignVault(CONTRACT_ADDRESSES.BESTOW_HUB, newVaultAddress);
            alert("Campaign Vault Updated!");
            await loadData();
        } catch (err: any) {
            alert("Failed to update vault: " + err.message);
        } finally {
            setProcessing(false);
        }
    };

    const handleRefillRewards = async () => {
        if (!refillAmount || isNaN(Number(refillAmount))) return alert("Invalid amount");
        try {
            setProcessing(true);
            await contractService.refillVaultRewards(CONTRACT_ADDRESSES.BESTOW_VAULT, refillAmount);
            alert("Rewards Refilled!");
            setRefillAmount('');
            await loadData();
        } catch (err: any) {
            alert("Refill failed: " + err.message);
        } finally {
            setProcessing(false);
        }
    };

    const handleUpdateVaultParams = async () => {
        if (!newAPY || !newLockup) return alert("Fill all fields");
        try {
            setProcessing(true);
            // APY is in bps (e.g. 10% = 1000), Lockup in seconds (e.g. 1 day = 86400)
            await contractService.updateVaultParams(CONTRACT_ADDRESSES.BESTOW_VAULT, Number(newAPY), Number(newLockup));
            alert("Vault Parameters Updated!");
            await loadData();
        } catch (err: any) {
            alert("Update failed: " + err.message);
        } finally {
            setProcessing(false);
        }
    };

    const handleTogglePause = async (type: 'HUB' | 'VAULT') => {
        try {
            setProcessing(true);
            const addr = type === 'HUB' ? CONTRACT_ADDRESSES.BESTOW_HUB : CONTRACT_ADDRESSES.BESTOW_VAULT;
            await contractService.togglePause(addr, type);
            await loadData();
        } catch (err: any) {
            alert("Action failed: " + err.message);
        } finally {
            setProcessing(false);
        }
    };

    const handleCompleteMilestone = async (campaignAddress: string, index: number) => {
        try {
            setProcessing(true);
            await contractService.completeMilestone(campaignAddress, index);
            await loadData();
        } catch (err: any) {
            alert("Verification failed: " + err.message);
        } finally {
            setProcessing(false);
        }
    };

    if (loading) return <div className="container" style={{ paddingTop: '100px' }}>Loading dashboard...</div>;

    if (!isOwner) return (
        <div className="container" style={{ paddingTop: '100px', textAlign: 'center' }}>
            <AlertTriangle size={64} color="#ef4444" style={{ marginBottom: '24px' }} />
            <h1>Access Denied</h1>
            <p>Only the platform owner ({address?.slice(0, 6)}...) can access this page.</p>
        </div>
    );

    return (
        <div className="container" style={{ paddingTop: '80px', paddingBottom: '80px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
                <div>
                    <h1 style={{ fontSize: '3rem', marginBottom: '8px' }}>Admin Console</h1>
                    <p style={{ color: 'var(--text-secondary)' }}>Ecosystem Management & Governance</p>
                </div>
                <button className="btn-secondary" onClick={loadData} disabled={processing}>
                    <RefreshCcw size={16} className={processing ? 'animate-spin' : ''} />
                </button>
            </div>

            {/* Config & Security Section */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '32px', marginBottom: '64px' }}>

                {/* Hub Config */}
                <div className="glass-panel" style={{ padding: '32px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                        <Zap color="var(--accent)" />
                        <h2 style={{ fontSize: '1.5rem' }}>Hub Configuration</h2>
                    </div>

                    <div style={{ marginBottom: '20px' }}>
                        <label style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '8px' }}>Current Campaign Vault</label>
                        <code>{currentCampaignVault || 'Not Set'}</code>
                    </div>

                    <div style={{ display: 'flex', gap: '8px' }}>
                        <input
                            type="text"
                            className="glass-panel"
                            placeholder="New Vault Address (0x...)"
                            value={newVaultAddress}
                            onChange={(e) => setNewVaultAddress(e.target.value)}
                            style={{ flex: 1, padding: '12px', background: 'rgba(255,255,255,0.05)', border: 'none', color: 'white' }}
                        />
                        <button className="btn-primary" onClick={handleSetCampaignVault} disabled={processing}>Set</button>
                    </div>

                    <div style={{ marginTop: '32px', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '24px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ color: hubPaused ? "#ef4444" : "#10b981", fontWeight: 700 }}>
                                Hub Status: {hubPaused ? "PAUSED" : "ACTIVE"}
                            </span>
                            <button
                                style={{ background: hubPaused ? '#10b981' : '#ef4444', color: 'white', padding: '8px 16px', borderRadius: '8px', border: 'none', cursor: 'pointer' }}
                                onClick={() => handleTogglePause('HUB')}
                                disabled={processing}
                            >
                                {hubPaused ? "Resume" : "Pause"}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Vault Management */}
                <div className="glass-panel" style={{ padding: '32px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                        <Shield color="var(--accent)" />
                        <h2 style={{ fontSize: '1.5rem' }}>Vault & Rewards</h2>
                    </div>

                    <div style={{ marginBottom: '24px' }}>
                        <label style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '8px' }}>Refill Reward Pool (Target Testnet USDC)</label>
                        <div style={{ display: 'flex', gap: '8px' }}>
                            <input
                                type="number"
                                className="glass-panel"
                                placeholder="Amount"
                                value={refillAmount}
                                onChange={(e) => setRefillAmount(e.target.value)}
                                style={{ flex: 1, padding: '12px', background: 'rgba(255,255,255,0.05)', border: 'none', color: 'white' }}
                            />
                            <button className="btn-primary" onClick={handleRefillRewards} disabled={processing}>Refill</button>
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '24px' }}>
                        <div>
                            <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>APY (bps, 1250=12.5%)</label>
                            <input
                                type="number"
                                className="glass-panel"
                                placeholder="1250"
                                value={newAPY}
                                onChange={(e) => setNewAPY(e.target.value)}
                                style={{ width: '100%', padding: '12px', background: 'rgba(255,255,255,0.05)', border: 'none', color: 'white', marginTop: '4px' }}
                            />
                        </div>
                        <div>
                            <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Lockup (seconds)</label>
                            <input
                                type="number"
                                className="glass-panel"
                                placeholder="86400"
                                value={newLockup}
                                onChange={(e) => setNewLockup(e.target.value)}
                                style={{ width: '100%', padding: '12px', background: 'rgba(255,255,255,0.05)', border: 'none', color: 'white', marginTop: '4px' }}
                            />
                        </div>
                    </div>
                    <button className="btn-secondary" style={{ width: '100%' }} onClick={handleUpdateVaultParams} disabled={processing}>Update Params</button>

                    <div style={{ marginTop: '24px', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '24px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ color: vaultPaused ? "#ef4444" : "#10b981", fontWeight: 700 }}>
                                Vault Status: {vaultPaused ? "PAUSED" : "ACTIVE"}
                            </span>
                            <button
                                style={{ background: vaultPaused ? '#10b981' : '#ef4444', color: 'white', padding: '8px 16px', borderRadius: '8px', border: 'none', cursor: 'pointer' }}
                                onClick={() => handleTogglePause('VAULT')}
                                disabled={processing}
                            >
                                {vaultPaused ? "Resume" : "Pause"}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Campaign Table */}
            <h2 style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                <Clock size={20} /> Milestone Verification Queue
            </h2>
            <div className="glass-panel" style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead>
                        <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                            <th style={{ padding: '20px' }}>Campaign</th>
                            <th style={{ padding: '20px' }}>Milestones & Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {campaigns.map(campaign => (
                            <tr key={campaign.campaignAddress} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                <td style={{ padding: '20px', verticalAlign: 'top' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                        <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: 'var(--accent)', opacity: 0.2 }}></div>
                                        <div>
                                            <p style={{ fontWeight: 700, fontSize: '1.1rem' }}>{campaign.title}</p>
                                            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{campaign.campaignAddress}</p>
                                        </div>
                                    </div>
                                </td>
                                <td style={{ padding: '20px' }}>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                        {campaign.milestones.map((m: any) => (
                                            <div key={m.index} style={{
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                alignItems: 'center',
                                                background: 'rgba(255,255,255,0.03)',
                                                padding: '12px 16px',
                                                borderRadius: '12px'
                                            }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                    {m.completed ? <Check size={16} color="#10b981" /> : <div style={{ width: 16 }} />}
                                                    <span style={{ color: m.completed ? 'var(--text-secondary)' : 'inherit' }}>
                                                        {m.description} <span style={{ opacity: 0.5, fontSize: '0.8rem' }}>({m.offsetPercent}%)</span>
                                                    </span>
                                                </div>
                                                {!m.completed && (
                                                    <button
                                                        className="btn-primary"
                                                        style={{ padding: '6px 16px', fontSize: '0.8rem' }}
                                                        onClick={() => handleCompleteMilestone(campaign.campaignAddress, m.index)}
                                                        disabled={processing}
                                                    >
                                                        Approve
                                                    </button>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
