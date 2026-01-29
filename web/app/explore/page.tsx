'use client';

import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { BestowHub } from '../../lib/mockContracts';
import { Shield, X, Check, Info } from 'lucide-react';

const MAX_DONATION = 10000; // Maximum donation limit

export default function ExplorePage() {
    const [campaigns, setCampaigns] = useState<any[]>([]);
    const [isConnected, setIsConnected] = useState(false);

    // Donation Logic State
    const [selectedCampaign, setSelectedCampaign] = useState<any | null>(null);
    const [donationAmount, setDonationAmount] = useState('');
    const [step, setStep] = useState(1); // 1: Input, 2: Confirm, 3: Success
    const [processing, setProcessing] = useState(false);

    // Derived Fees
    const amount = parseFloat(donationAmount) || 0;
    const platformFee = amount * 0.01;
    const gasFee = 0.005; // Mock ARC Gas
    const total = amount + platformFee + gasFee;

    // Check wallet connection
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
        loadCampaigns();

        // Listen for account changes
        if (typeof window !== 'undefined' && (window as any).ethereum) {
            (window as any).ethereum.on('accountsChanged', (accounts: string[]) => {
                setIsConnected(accounts.length > 0);
            });
        }
    }, []);

    const loadCampaigns = () => {
        BestowHub.getCampaigns().then(setCampaigns);
    };

    const handleDonateClick = (campaign: any) => {
        if (!isConnected) {
            alert("Please connect your wallet first!");
            return;
        }
        setSelectedCampaign(campaign);
        setDonationAmount('');
        setStep(1);
    };

    const handleConfirm = async () => {
        if (!selectedCampaign) return;
        if (!isConnected) {
            alert("Please connect your wallet first!");
            return;
        }
        if (amount > MAX_DONATION) {
            alert(`Maximum donation is ${MAX_DONATION} USDC`);
            return;
        }
        setProcessing(true);
        try {
            await BestowHub.donate(selectedCampaign.id, amount, platformFee, gasFee);
            setStep(3); // Success
            loadCampaigns(); // Refresh progress
        } catch (err) {
            alert("Donation failed: " + (err as any).message);
        } finally {
            setProcessing(false);
        }
    };

    return (
        <div className="container" style={{ paddingTop: '80px', paddingBottom: '80px' }}>
            <h1 style={{ fontSize: '3rem', marginBottom: '40px' }}>Explore Campaigns</h1>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '32px' }}>
                {campaigns.map((campaign) => {
                    const percent = Math.min(100, Math.floor((campaign.raised / campaign.goal) * 100));
                    const riskColor = campaign.riskReport?.score > 50 ? '#ef4444' : '#10b981'; // Red or Green

                    // Fallback Gradient Logic
                    const getGradient = (text: string) => {
                        const colors = ['#3b82f6', '#8b5cf6', '#ec4899', '#10b981', '#f59e0b'];
                        const hash = (text || '').split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
                        const c1 = colors[hash % colors.length];
                        const c2 = colors[(hash + 1) % colors.length];
                        return `linear-gradient(135deg, ${c1}, ${c2})`;
                    };

                    const bgImage = campaign.image
                        ? (campaign.image.startsWith('linear-gradient') ? campaign.image : `url(${campaign.image}) center/cover`)
                        : getGradient(campaign.title);

                    return (
                        <motion.div
                            key={campaign.id}
                            className="glass-panel"
                            whileHover={{ y: -5 }}
                            style={{ padding: '24px', position: 'relative' }}
                        >
                            {/* Risk Badge */}
                            {campaign.riskReport && (
                                <div style={{
                                    position: 'absolute',
                                    top: '16px',
                                    right: '16px',
                                    background: 'var(--bg-primary)',
                                    border: `1px solid ${riskColor}`,
                                    padding: '6px 10px',
                                    borderRadius: '8px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    fontSize: '0.8rem',
                                    fontWeight: 700,
                                    color: riskColor,
                                    zIndex: 10
                                }}>
                                    <Shield size={14} />
                                    Risk Score: {campaign.riskReport.score}
                                </div>
                            )}

                            <div style={{
                                height: '200px',
                                background: bgImage,
                                borderRadius: '12px',
                                marginBottom: '24px'
                            }}></div>
                            <h3 style={{ marginBottom: '8px' }}>{campaign.title}</h3>
                            <p style={{ color: 'var(--text-secondary)', marginBottom: '24px', fontSize: '0.9rem' }}>
                                {campaign.description}
                            </p>

                            {/* Progress Info */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.9rem' }}>
                                <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{campaign.raised.toLocaleString()} USDC</span>
                                <span style={{ color: 'var(--text-secondary)' }}>of {campaign.goal.toLocaleString()} USDC</span>
                            </div>

                            <div style={{ width: '100%', height: '8px', background: 'var(--bg-secondary)', borderRadius: '4px', marginBottom: '24px', overflow: 'hidden' }}>
                                <div style={{ width: `${percent}%`, height: '100%', background: 'var(--accent)' }}></div>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ fontWeight: 700, color: 'var(--accent)' }}>{percent}% Funded</span>
                                <button
                                    className="btn-primary"
                                    style={{ padding: '8px 24px', fontSize: '0.9rem' }}
                                    onClick={() => handleDonateClick(campaign)}
                                >
                                    Donate
                                </button>
                            </div>
                        </motion.div>
                    );
                })}
            </div>

            {/* Donation Modal */}
            <AnimatePresence>
                {selectedCampaign && (
                    <div style={{
                        position: 'fixed', inset: 0, zIndex: 1000,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        backdropFilter: 'blur(8px)', background: 'rgba(0,0,0,0.6)'
                    }}>
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="glass-panel"
                            style={{ width: '100%', maxWidth: '500px', padding: '32px', margin: '24px', position: 'relative', background: '#0f172a' }}
                        >
                            <button
                                onClick={() => setSelectedCampaign(null)}
                                style={{ position: 'absolute', top: '24px', right: '24px', background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}
                            >
                                <X size={24} />
                            </button>

                            {step === 1 && (
                                <>
                                    <h2 style={{ marginBottom: '8px' }}>Donate to {selectedCampaign.title}</h2>
                                    <p style={{ color: 'var(--text-secondary)', marginBottom: '32px' }}>Support this project and earn yield.</p>

                                    <div style={{ marginBottom: '32px' }}>
                                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600 }}>Enter Amount (USDC)</label>
                                        <input
                                            type="number"
                                            autoFocus
                                            value={donationAmount}
                                            onChange={(e) => setDonationAmount(e.target.value)}
                                            placeholder="0.00"
                                            style={{
                                                width: '100%', padding: '16px', borderRadius: '12px',
                                                background: 'var(--bg-secondary)', border: '1px solid var(--border)',
                                                color: 'var(--text-primary)', fontSize: '1.5rem', fontWeight: 700
                                            }}
                                        />
                                    </div>

                                    <button
                                        className="btn-primary"
                                        disabled={!amount || amount <= 0}
                                        style={{ width: '100%', padding: '16px', fontSize: '1.1rem', opacity: (!amount || amount <= 0) ? 0.5 : 1 }}
                                        onClick={() => setStep(2)}
                                    >
                                        Next: Review Fees
                                    </button>
                                </>
                            )}

                            {step === 2 && (
                                <>
                                    <h2 style={{ marginBottom: '32px' }}>Confirm Donation</h2>

                                    <div style={{ background: 'var(--bg-secondary)', borderRadius: '16px', padding: '24px', marginBottom: '32px' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                                            <span style={{ color: 'var(--text-secondary)' }}>Donation Amount</span>
                                            <span style={{ fontWeight: 600 }}>{amount.toFixed(2)} USDC</span>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                                            <span style={{ color: 'var(--text-secondary)' }}>Network Gas (Est.)</span>
                                            <span style={{ fontWeight: 600 }}>{gasFee} USDC</span>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                                            <span style={{ color: 'var(--text-secondary)' }}>Platform Fee (1%)</span>
                                            <span style={{ fontWeight: 600 }}>{platformFee.toFixed(2)} USDC</span>
                                        </div>
                                        <div style={{ height: '1px', background: 'var(--border)', margin: '16px 0' }}></div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.2rem' }}>
                                            <span style={{ fontWeight: 700 }}>Total</span>
                                            <span style={{ fontWeight: 700, color: 'var(--accent)' }}>{total.toFixed(4)} USDC</span>
                                        </div>
                                    </div>

                                    <button
                                        className="btn-primary"
                                        disabled={processing}
                                        style={{ width: '100%', padding: '16px', fontSize: '1.1rem', opacity: processing ? 0.7 : 1 }}
                                        onClick={handleConfirm}
                                    >
                                        {processing ? 'Confirming Transaction...' : 'Confirm & Donate'}
                                    </button>
                                </>
                            )}

                            {step === 3 && (
                                <div style={{ textAlign: 'center', padding: '24px 0' }}>
                                    <div style={{
                                        width: '80px', height: '80px', borderRadius: '50%', background: '#10b981',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px',
                                        color: 'white'
                                    }}>
                                        <Check size={40} strokeWidth={3} />
                                    </div>
                                    <h2 style={{ marginBottom: '16px' }}>Donation Successful!</h2>
                                    <p style={{ color: 'var(--text-secondary)', marginBottom: '32px' }}>
                                        You successfully donated {amount.toFixed(2)} USDC to {selectedCampaign.title}.
                                    </p>
                                    <button
                                        className="glass-panel"
                                        style={{ padding: '12px 32px', cursor: 'pointer', fontWeight: 600 }}
                                        onClick={() => setSelectedCampaign(null)}
                                    >
                                        Close
                                    </button>
                                </div>
                            )}
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
