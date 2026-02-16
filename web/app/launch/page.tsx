'use client';

import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { BestowHub as MockHub } from '../../lib/mockContracts';
import { contractService } from '../../lib/contracts';
import { CONTRACT_ADDRESSES } from '../../lib/config';
import { analyzeRisk, RiskReport } from '../../lib/riskAnalysis';
import { Camera, Shield, Target, Plus, AlertTriangle, CheckCircle } from 'lucide-react';

export default function LaunchPage() {
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [isConnected, setIsConnected] = useState(false);

    useEffect(() => {
        if (typeof window !== 'undefined' && (window as any).ethereum) {
            (window as any).ethereum.request({ method: 'eth_accounts' })
                .then((accounts: string[]) => setIsConnected(accounts.length > 0));
        }
    }, []);

    // New Feature State
    const [milestones, setMilestones] = useState([{ desc: 'Initial Release', amount: 50 }]); // Default 50%

    const addMilestone = () => {
        setMilestones([...milestones, { desc: '', amount: 0 }]);
    };

    return (
        <div className="container" style={{ paddingTop: '80px', paddingBottom: '80px', maxWidth: '800px' }}>
            <div style={{ marginBottom: '40px', textAlign: 'center' }}>
                <h1 style={{ fontSize: '2.5rem', marginBottom: '16px' }}>Launch a Campaign</h1>
                <p style={{ color: 'var(--text-secondary)' }}>
                    Create a crowdfunding campaign on the ARC Network secured by escrow.
                </p>
            </div>

            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="glass-panel"
                style={{ padding: '40px' }}
            >
                <form
                    onSubmit={async (e) => {
                        e.preventDefault();
                        if (!isConnected) {
                            alert("Please connect your wallet first!");
                            return;
                        }

                        const title = (e.target as any).title.value;
                        const goal = (e.target as any).goal.value;
                        const desc = (e.target as any).desc.value;

                        if (!title || !goal || !desc) return;

                        // Validate milestones sum to 100%
                        const totalPct = milestones.reduce((acc, m) => acc + (m.amount || 0), 0);
                        if (totalPct !== 100) {
                            alert(`Milestone percentages must sum to 100%. Current total: ${totalPct}%`);
                            return;
                        }

                        setLoading(true);
                        try {
                            const autoRiskReport = await analyzeRisk(title || '', desc, parseFloat(goal) || 0);

                            // Contract Interaction
                            const campaignData = {
                                title,
                                description: desc,
                                target: parseFloat(goal),
                                duration: 30, // Default 30 days
                                milestones: milestones.map(m => ({
                                    description: m.desc,
                                    offsetPercent: m.amount
                                })),
                                riskScore: autoRiskReport.score,
                                riskLevel: autoRiskReport.level
                            };

                            try {
                                await contractService.createCampaign(CONTRACT_ADDRESSES.BESTOW_HUB, campaignData);
                            } catch (contractErr) {
                                console.warn("Contract creation failed, falling back to mock:", contractErr);
                                // Fallback to mock for testing/no-provider cases
                                await MockHub.createCampaign(
                                    title,
                                    parseFloat(goal),
                                    desc,
                                    milestones,
                                    autoRiskReport,
                                    `linear-gradient(135deg, #3b82f6, #8b5cf6)`
                                );
                            }

                            setSuccess(true);
                            (e.target as any).reset();
                        } catch (err) {
                            alert("Failed to launch campaign: " + (err as any).message);
                        } finally {
                            setLoading(false);
                        }
                    }}
                    style={{ display: 'grid', gap: '24px' }}
                >
                    <div>
                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>Project Image</label>
                        <label style={{
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '8px',
                            padding: '12px 20px',
                            background: 'var(--bg-secondary)',
                            borderRadius: '12px',
                            border: '1px solid var(--border)',
                            color: 'var(--text-primary)',
                            fontSize: '0.9rem',
                            fontWeight: 500
                        }}>
                            <Camera size={18} />
                            Upload Cover Photo
                            <input type="file" accept="image/*" style={{ display: 'none' }} />
                        </label>
                    </div>

                    <div>
                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>Campaign Title</label>
                        <input name="title" type="text" placeholder="e.g. Next Gen Water Filter" style={{
                            width: '100%',
                            padding: '16px',
                            borderRadius: '12px',
                            border: '1px solid var(--border)',
                            background: 'var(--bg-secondary)',
                            color: 'var(--text-primary)',
                            fontSize: '1rem'
                        }} />
                    </div>

                    <div>
                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>Funding Goal (USDC)</label>
                        <input name="goal" type="number" placeholder="50000" style={{
                            width: '100%',
                            padding: '16px',
                            borderRadius: '12px',
                            border: '1px solid var(--border)',
                            background: 'var(--bg-secondary)',
                            color: 'var(--text-primary)',
                            fontSize: '1rem'
                        }} />
                    </div>

                    <div>
                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>Description</label>
                        <textarea name="desc" rows={5} placeholder="Describe your project..." style={{
                            width: '100%',
                            padding: '16px',
                            borderRadius: '12px',
                            border: '1px solid var(--border)',
                            background: 'var(--bg-secondary)',
                            color: 'var(--text-primary)',
                            fontSize: '1rem',
                            fontFamily: 'inherit'
                        }} />
                    </div>

                    {/* AI Risk Analysis Section */}


                    {/* Milestone Section */}
                    <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                            <label style={{ fontWeight: 500, display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <Target size={16} /> Project Milestones
                            </label>
                            <button type="button" onClick={addMilestone} style={{ background: 'none', border: 'none', color: 'var(--accent)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <Plus size={16} /> Add Phase
                            </button>
                        </div>
                        <div style={{ display: 'grid', gap: '12px' }}>
                            {milestones.map((m, i) => (
                                <div key={i} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '12px' }}>
                                    <input
                                        placeholder={`Phase ${i + 1} Deliverable`}
                                        value={m.desc}
                                        onChange={(e) => {
                                            const newM = [...milestones];
                                            newM[i].desc = e.target.value;
                                            setMilestones(newM);
                                        }}
                                        style={{ padding: '12px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
                                    />
                                    <div style={{ position: 'relative' }}>
                                        <input
                                            type="number"
                                            placeholder="%"
                                            value={m.amount}
                                            onChange={(e) => {
                                                const newM = [...milestones];
                                                newM[i].amount = parseInt(e.target.value);
                                                setMilestones(newM);
                                            }}
                                            style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
                                        />
                                        <span style={{ position: 'absolute', right: '12px', top: '12px', color: 'var(--text-secondary)' }}>%</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <button
                        disabled={loading}
                        className="btn-primary"
                        style={{ padding: '16px', fontSize: '1.1rem', opacity: loading ? 0.7 : 1, cursor: loading ? 'not-allowed' : 'pointer' }}
                    >
                        {loading ? 'Creating Campaign...' : success ? 'Campaign Created!' : 'Create Campaign'}
                    </button>

                    {success && (
                        <div style={{
                            padding: '16px',
                            background: 'rgba(16, 185, 129, 0.1)',
                            border: '1px solid #10b981',
                            borderRadius: '12px',
                            color: '#10b981',
                            textAlign: 'center'
                        }}>
                            <p style={{ fontWeight: 700 }}>Success!</p>
                            <p style={{ fontSize: '0.9rem' }}>Your campaign has been launched on the ARC Network simulation layer.</p>
                        </div>
                    )}
                </form>
            </motion.div>
        </div>
    );
}
