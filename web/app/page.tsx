'use client';

import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import QuoteSection from '../components/QuoteSection';

export default function Home() {
    const [activeText, setActiveText] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setActiveText(prev => prev === 0 ? 1 : 0);
        }, 8000); // 8 seconds per text
        return () => clearInterval(interval);
    }, []);
    return (
        <div style={{ paddingTop: '80px', paddingBottom: '100px' }}>
            {/* Hero Section */}
            <section className="container" style={{ textAlign: 'center', marginBottom: '120px' }}>
                <motion.h1
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.8 }}
                    style={{
                        fontSize: '4.5rem',
                        fontWeight: 800,
                        lineHeight: 1.1,
                        marginBottom: '24px',
                        background: 'linear-gradient(135deg, var(--text-primary) 0%, var(--accent) 100%)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        backgroundClip: 'text',
                    }}
                >
                    Fund the Future.<br />Earn Yield.
                </motion.h1>

                <div style={{ minHeight: '100px', marginBottom: '40px', position: 'relative' }}>
                    <AnimatePresence mode="wait">
                        <motion.p
                            key={activeText}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.5 }}
                            style={{
                                fontSize: '1.25rem',
                                color: 'var(--text-secondary)',
                                maxWidth: '700px',
                                margin: '0 auto',
                                position: 'absolute',
                                width: '100%',
                                left: 0,
                                right: 0
                            }}
                        >
                            {activeText === 0
                                ? "Step into the future of giving! Together, we’re reimagining how nonprofits and social causes thrive—driven by unstoppable, community-powered crypto fundraising innovation."
                                : "Bestow is the first decentralized crowdfunding platform on the ARC Network that rewards contributors with real yield. Support innovative projects and grow your assets simultaneously."
                            }
                        </motion.p>
                    </AnimatePresence>
                </div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5, duration: 0.6 }}
                    style={{ display: 'flex', gap: '16px', justifyContent: 'center', marginBottom: '100px' }}
                >
                    <Link href="/launch">
                        <button className="btn-primary" style={{ fontSize: '1.1rem', padding: '16px 32px' }}>
                            Start Campaign
                        </button>
                    </Link>
                    <Link href="/explore">
                        <button className="glass-panel" style={{
                            padding: '16px 32px',
                            fontWeight: 600,
                            color: 'var(--text-primary)',
                            background: 'var(--bg-secondary)',
                            border: 'none',
                            borderRadius: '99px',
                            fontSize: '1.1rem',
                            cursor: 'pointer'
                        }}>
                            Explore Projects
                        </button>
                    </Link>
                </motion.div>

                {/* Features / Value Prop */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '32px', textAlign: 'left' }}>
                    <motion.div
                        whileHover={{ y: -5 }}
                        className="glass-panel"
                        style={{ padding: '32px' }}
                    >
                        <div style={{ fontSize: '2rem', marginBottom: '16px' }}>🤖</div>
                        <h3 style={{ marginBottom: '12px' }}>AI-Powered Risk Analysis</h3>
                        <p style={{ color: 'var(--text-secondary)' }}>Real-time auditing of campaign legitimacy and developer reputation analysis to prevent fraud.</p>
                    </motion.div>

                    <motion.div
                        whileHover={{ y: -5 }}
                        className="glass-panel"
                        style={{ padding: '32px' }}
                    >
                        <div style={{ fontSize: '2rem', marginBottom: '16px' }}>🛡️</div>
                        <h3 style={{ marginBottom: '12px' }}>Milestone-Based Escrow</h3>
                        <p style={{ color: 'var(--text-secondary)' }}>Funds are released only when verified milestones are met, protecting backer funds.</p>
                    </motion.div>

                    <motion.div
                        whileHover={{ y: -5 }}
                        className="glass-panel"
                        style={{ padding: '32px' }}
                    >
                        <div style={{ fontSize: '2rem', marginBottom: '16px' }}>💰</div>
                        <h3 style={{ marginBottom: '12px' }}>Yield Vaults</h3>
                        <p style={{ color: 'var(--text-secondary)' }}>Earn native yield on your idle assets with our specialized institutional vaults on the ARC Network.</p>
                    </motion.div>
                </div>
            </section>

            {/* Quote Section - The Spirit of Bestow */}
            <section style={{ padding: '80px 0', textAlign: 'center', overflow: 'hidden' }}>
                <style jsx>{`
                    @keyframes scroll-left {
                        0% { transform: translateX(0); }
                        100% { transform: translateX(-50%); }
                    }
                    .quote-marquee {
                        display: flex;
                        gap: 32px;
                        width: max-content;
                        animation: scroll-left 60s linear infinite;
                    }
                    .quote-marquee:hover {
                        animation-play-state: paused;
                    }
                `}</style>

                <div style={{ marginBottom: '60px', padding: '0 24px' }}>
                    <h2 style={{ fontSize: '2.5rem', marginBottom: '16px' }}>The Spirit of Bestow</h2>
                    <p style={{ color: 'var(--text-secondary)', letterSpacing: '0.15em', textTransform: 'uppercase', fontSize: '0.9rem', fontWeight: 600 }}>
                        Community Wisdom & Values
                    </p>
                </div>

                <div className="quote-marquee">
                    {[
                        { text: "No one has ever become poor by giving.", author: "Anne Frank", role: "Writer & Diarist" },
                        { text: "We make a living by what we get, but we make a life by what we give.", author: "Winston Churchill", role: "Former UK Prime Minister" },
                        { text: "The best way to find yourself is to lose yourself in the service of others.", author: "Mahatma Gandhi", role: "Civil Rights Leader" },
                        { text: "Giving is not just about making a donation. It is about making a difference.", author: "Kathy Calvin", role: "CEO, United Nations Foundation" },
                        { text: "We rise by lifting others.", author: "Robert Ingersoll", role: "Orator & Lawyer" },
                        { text: "Charity sees the need, not the cause.", author: "German Proverb", role: "Timeless Wisdom" }
                    ].concat([ // Duplicating for seamless loop
                        { text: "No one has ever become poor by giving.", author: "Anne Frank", role: "Writer & Diarist" },
                        { text: "We make a living by what we get, but we make a life by what we give.", author: "Winston Churchill", role: "Former UK Prime Minister" },
                        { text: "The best way to find yourself is to lose yourself in the service of others.", author: "Mahatma Gandhi", role: "Civil Rights Leader" },
                        { text: "Giving is not just about making a donation. It is about making a difference.", author: "Kathy Calvin", role: "CEO, United Nations Foundation" },
                        { text: "We rise by lifting others.", author: "Robert Ingersoll", role: "Orator & Lawyer" },
                        { text: "Charity sees the need, not the cause.", author: "German Proverb", role: "Timeless Wisdom" }
                    ]).map((quote, i) => (
                        <div
                            key={i}
                            className="glass-panel"
                            style={{
                                width: '400px',
                                padding: '40px',
                                textAlign: 'left',
                                display: 'flex',
                                flexDirection: 'column',
                                justifyContent: 'space-between',
                                position: 'relative',
                                flexShrink: 0
                            }}
                        >
                            {/* Watermark Icon */}
                            <div style={{ position: 'absolute', top: '24px', right: '24px', fontSize: '4rem', opacity: 0.1, fontFamily: 'serif' }}>"</div>

                            <p style={{ fontSize: '1.2rem', fontStyle: 'italic', marginBottom: '32px', lineHeight: '1.6', position: 'relative', zIndex: 1 }}>
                                "{quote.text}"
                            </p>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                <div style={{
                                    width: '40px',
                                    height: '40px',
                                    borderRadius: '50%',
                                    background: 'var(--accent)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: 'var(--bg-primary)',
                                    fontWeight: 700
                                }}>
                                    {quote.author[0]}
                                </div>
                                <div>
                                    <p style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-primary)' }}>{quote.author}</p>
                                    <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                        {quote.role}
                                    </p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </section>
        </div>
    );
}
