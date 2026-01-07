'use client';

import Link from 'next/link';
import { Twitter, Github, Heart } from 'lucide-react';

export default function Footer() {
    return (
        <footer style={{
            background: 'var(--bg-primary)',
            borderTop: '1px solid var(--border)',
            padding: '80px 0 32px'
        }}>
            <div className="container">
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '48px',
                    marginBottom: '64px'
                }}>
                    {/* Brand Column */}
                    <div style={{ maxWidth: '300px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
                            <div style={{
                                width: '32px',
                                height: '32px',
                                background: 'var(--accent)',
                                borderRadius: '4px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: 'var(--bg-primary)',
                                fontWeight: 'bold',
                                fontSize: '18px'
                            }}>
                                B
                            </div>
                            <span style={{ fontSize: '1.5rem', fontWeight: 700 }}>bestow</span>
                        </div>
                        <p style={{ color: 'var(--text-secondary)', lineHeight: '1.6' }}>
                            Secure crowdfunding with AI-powered risk analysis and milestone-based escrow protection.
                        </p>
                    </div>

                    {/* Links Section Wrapper */}
                    <div style={{ display: 'flex', gap: '80px', flexWrap: 'wrap' }}>
                        {/* Platform */}
                        <div>
                            <h4 style={{ fontSize: '0.875rem', fontWeight: 700, letterSpacing: '0.05em', marginBottom: '24px', textTransform: 'uppercase' }}>
                                Platform
                            </h4>
                            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                <li><Link href="/explore" style={{ color: 'var(--text-secondary)', textDecoration: 'none' }}>Explore Projects</Link></li>
                                <li><Link href="/vault" style={{ color: 'var(--text-secondary)', textDecoration: 'none' }}>Yield Vaults</Link></li>
                                <li><Link href="/launch" style={{ color: 'var(--text-secondary)', textDecoration: 'none' }}>Launch Campaign</Link></li>
                            </ul>
                        </div>

                        {/* Resources */}
                        <div>
                            <h4 style={{ fontSize: '0.875rem', fontWeight: 700, letterSpacing: '0.05em', marginBottom: '24px', textTransform: 'uppercase' }}>
                                Resources
                            </h4>
                            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                <li><Link href="/docs" style={{ color: 'var(--text-secondary)', textDecoration: 'none' }}>Documentation</Link></li>
                                <li><Link href="/audit" style={{ color: 'var(--text-secondary)', textDecoration: 'none' }}>Security Audit</Link></li>
                                <li><Link href="/api" style={{ color: 'var(--text-secondary)', textDecoration: 'none' }}>API Reference</Link></li>
                            </ul>
                        </div>

                        {/* Community */}
                        <div>
                            <h4 style={{ fontSize: '0.875rem', fontWeight: 700, letterSpacing: '0.05em', marginBottom: '24px', textTransform: 'uppercase' }}>
                                Community
                            </h4>
                            <div style={{ display: 'flex', gap: '16px' }}>
                                {/* Mocking Icons with text/ascii if Lucide doesn't render perfectly in all environments without setup, but using Lucide class names */}
                                <div style={{ padding: '8px', background: 'var(--bg-secondary)', borderRadius: '8px', cursor: 'pointer' }}>X</div>
                                <div style={{ padding: '8px', background: 'var(--bg-secondary)', borderRadius: '8px', cursor: 'pointer' }}>👾</div>
                                <div style={{ padding: '8px', background: 'var(--bg-secondary)', borderRadius: '8px', cursor: 'pointer' }}>💻</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Bottom Bar */}
                <div style={{
                    borderTop: '1px solid var(--border)',
                    paddingTop: '32px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '16px',
                    color: 'var(--text-secondary)',
                    fontSize: '0.9rem'
                }}>
                    <div>
                        &copy; 2026 Glencorse Labs. All rights reserved.
                    </div>
                    <div style={{ display: 'flex', gap: '24px' }}>
                        <Link href="/privacy" style={{ color: 'var(--text-secondary)', textDecoration: 'none' }}>Privacy Policy</Link>
                        <Link href="/terms" style={{ color: 'var(--text-secondary)', textDecoration: 'none' }}>Terms of Service</Link>
                    </div>
                </div>
            </div>
        </footer>
    );
}
