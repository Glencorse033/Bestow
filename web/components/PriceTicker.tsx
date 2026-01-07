'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

interface Coin {
    id: string;
    symbol: string;
    name: string;
    current_price: number;
    price_change_percentage_24h: number;
}

export default function PriceTicker() {
    const [coins, setCoins] = useState<Coin[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchPrices = async () => {
            try {
                // Using CoinGecko API as a reliable open source for top crypto data
                const res = await fetch('https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=100&page=1&sparkline=false');
                if (res.ok) {
                    const data = await res.json();
                    setCoins(data);
                }
            } catch (error) {
                console.error("Failed to fetch prices", error);
            } finally {
                setLoading(false);
            }
        };

        fetchPrices();
        // Refresh every 60 seconds
        const interval = setInterval(fetchPrices, 60000);
        return () => clearInterval(interval);
    }, []);

    if (loading) return <div style={{ height: '22px', background: '#020617' }}></div>;

    return (
        <div style={{
            background: '#020617',
            borderBottom: '1px solid rgba(255,255,255,0.1)',
            height: '22px',
            overflow: 'hidden',
            display: 'flex',
            alignItems: 'center',
            position: 'relative',
            zIndex: 200,
            width: '100%'
        }}>
            <style jsx>{`
        @keyframes scroll {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .marquee-content {
          display: flex;
          gap: 40px;
          padding-left: 20px;
          white-space: nowrap;
          animation: scroll 240s linear infinite;
        }
        .marquee-content:hover {
          animation-play-state: paused;
        }
      `}</style>

            <div className="marquee-content" style={{ width: 'fit-content' }}>
                {[...coins, ...coins].map((coin, index) => (
                    <div key={`${coin.id}-${index}`} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.6rem' }}>
                        <span style={{ fontWeight: 700, color: '#f8fafc', textTransform: 'uppercase' }}>{coin.symbol}</span>
                        <span style={{ color: '#94a3b8' }}>${coin.current_price?.toLocaleString()}</span>
                        <span style={{
                            color: (coin.price_change_percentage_24h || 0) >= 0 ? '#10b981' : '#ef4444',
                            fontWeight: 500
                        }}>
                            {(coin.price_change_percentage_24h || 0) > 0 ? '+' : ''}{coin.price_change_percentage_24h?.toFixed(2)}%
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
}
