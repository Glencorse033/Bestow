'use client';

import { motion } from 'framer-motion';

const quotes = [
    { text: "No one has ever become poor by giving.", author: "Anne Frank" },
    { text: "We make a living by what we get, but we make a life by what we give.", author: "Winston Churchill" },
    { text: "The best way to find yourself is to lose yourself in the service of others.", author: "Mahatma Gandhi" }
];

export default function QuoteSection() {
    return (
        <section style={{ padding: '80px 24px', textAlign: 'center' }}>
            <h2 style={{ marginBottom: '40px', fontSize: '2rem' }}>Why We Give</h2>
            <div style={{ display: 'flex', gap: '32px', justifyContent: 'center', flexWrap: 'wrap' }}>
                {quotes.map((quote, index) => (
                    <motion.div
                        key={index}
                        className="glass-panel"
                        initial={{ opacity: 0, y: 50 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: index * 0.2, duration: 0.6 }}
                        style={{
                            padding: '32px',
                            maxWidth: '350px',
                            flex: '1 1 300px',
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'center'
                        }}
                    >
                        <p style={{ fontSize: '1.2rem', fontStyle: 'italic', marginBottom: '16px' }}>"{quote.text}"</p>
                        <p style={{ fontSize: '1rem', color: 'var(--text-secondary)', fontWeight: 600 }}>- {quote.author}</p>
                    </motion.div>
                ))}
            </div>
        </section>
    );
}
