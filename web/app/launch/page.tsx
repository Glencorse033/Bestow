'use client';

import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { BestowHub as MockHub } from '../../lib/mockContracts';
import { contractService, enforceNetwork } from '../../lib/contracts';
import { CONTRACT_ADDRESSES } from '../../lib/config';
import { analyzeRisk, RiskReport } from '../../lib/riskAnalysis';
import { Camera, Shield, Target, Plus, AlertTriangle, CheckCircle } from 'lucide-react';
import { ethers } from 'ethers';

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
    const [imageUrl, setImageUrl] = useState('');

    const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // basic validation
        if (!file.type.startsWith('image/')) {
            alert('Please select an image file');
            return;
        }

        const reader = new FileReader();
        reader.onload = (event) => {
            const img = new Image();
            img.onload = () => {
                // Resize logic using Canvas to keep Base64 small
                const canvas = document.createElement('canvas');
                const MAX_WIDTH = 300;
                let width = img.width;
                let height = img.height;

                if (width > MAX_WIDTH) {
                    height *= MAX_WIDTH / width;
                    width = MAX_WIDTH;
                }

                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx?.drawImage(img, 0, 0, width, height);

                // Compress to JPEG for smaller footprint
                const compressedBase64 = canvas.toDataURL('image/jpeg', 0.4);
                setImageUrl(compressedBase64);
            };
            img.src = event.target?.result as string;
        };
        reader.readAsDataURL(file);
    };

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

                        // Enforce Contract Constraints
                        if (!title || title.length > 100) {
                            alert("Title must be between 1 and 100 characters.");
                            return;
                        }
                        if (!desc || desc.length < 50 || desc.length > 2000) {
                            alert("Description must be between 50 and 2000 characters to be secured on-chain.");
                            return;
                        }
                        let parsedGoal;
                        try {
                            parsedGoal = ethers.parseEther(goal.toString() || "0");
                            if (parsedGoal <= BigInt(0)) throw new Error();
                        } catch {
                            alert("Goal must be a positive number.");
                            return;
                        }

                        // Validate milestones sum to 100%
                        const totalPct = milestones.reduce((acc, m) => acc + (m.amount || 0), 0);
                        if (totalPct !== 100) {
                            alert(`Milestone percentages must sum to 100%. Current total: ${totalPct}%`);
                            return;
                        }

                        setLoading(true);
                        try {
                            // SECURITY FIX: Silent Mainnet Transaction Risk
                            await enforceNetwork(new ethers.BrowserProvider((window as any).ethereum));

                            const accounts = await (window as any).ethereum.request({ method: 'eth_accounts' });
                            const creatorAddress = accounts[0];

                            // SECURITY FIX: Client-Side Score Forgery
                            // Call secure server side API to compute risk score and sign it
                            const riskResponse = await fetch('/api/analyze-risk', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                    title,
                                    description: desc,
                                    goal: goal.toString() || "0",
                                    creatorAddress
                                })
                            });

                            if (!riskResponse.ok) throw new Error("Failed to get risk score from Oracle");
                            const { riskScore, riskLevel, signature, timestamp } = await riskResponse.json();

                            // Contract Interaction
                            const campaignData = {
                                title,
                                description: desc,
                                image: imageUrl,
                                target: parsedGoal.toString(),
                                duration: 30, // Default 30 days
                                milestones: milestones.map(m => ({
                                    description: m.desc,
                                    offsetPercent: m.amount
                                })),
                                riskScore,
                                riskLevel,
                                signature,
                                timestamp
                            };

                            try {
                                await contractService.createCampaign(CONTRACT_ADDRESSES.BESTOW_HUB, campaignData);
                                setSuccess(true);
                                (e.target as any).reset();
                                setImageUrl('');
                            } catch (contractErr) {
                                console.error("Contract creation failed:", contractErr);
                                alert("Blockchain Error: " + (contractErr as any).message);
                            }
                        } catch (err) {
                            alert("Failed to launch campaign: " + (err as any).message);
                        } finally {
                            setLoading(false);
                        }
                    }}
                    style={{ display: 'grid', gap: '24px' }}
                >
                    <div>
                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>Project Cover Photo</label>
                        <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start' }}>
                            <label style={{
                                cursor: 'pointer',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                width: '200px',
                                height: '120px',
                                background: 'var(--bg-secondary)',
                                borderRadius: '12px',
                                border: '2px dashed var(--border)',
                                color: 'var(--text-secondary)',
                                transition: 'all 0.2s ease'
                            }}>
                                <Camera size={24} style={{ marginBottom: '8px' }} />
                                <span style={{ fontSize: '0.8rem' }}>Upload Image</span>
                                <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handleImageChange} />
                            </label>

                            {imageUrl && (
                                <div style={{ position: 'relative' }}>
                                    <img
                                        src={imageUrl}
                                        alt="Preview"
                                        style={{ width: '200px', height: '120px', borderRadius: '12px', objectFit: 'cover', border: '1px solid var(--accent)' }}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setImageUrl('')}
                                        style={{
                                            position: 'absolute', top: '-8px', right: '-8px',
                                            background: '#ef4444', color: 'white', border: 'none',
                                            borderRadius: '50%', width: '24px', height: '24px', cursor: 'pointer',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px'
                                        }}
                                    >
                                        ✕
                                    </button>
                                </div>
                            )}
                        </div>
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '8px' }}>
                            Optimized for blockchain: Images are automatically resized for fast on-chain storage.
                        </p>
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
