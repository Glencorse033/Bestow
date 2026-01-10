'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, X, Send, Bot } from 'lucide-react';

type Message = {
    id: string;
    text: string;
    sender: 'user' | 'bot';
    timestamp: Date;
};

const KNOWLEDGE_BASE = [
    {
        keywords: ['hi', 'hello', 'hey', 'start'],
        response: "Hello! I'm the Bestow AI Assistant. Ask me about our Vaults, Crowdfunding, or Supported Networks!"
    },
    {
        keywords: ['what is bestow', 'about', 'explain'],
        response: "Bestow is a decentralized crowdfunding platform secured by AI-powered risk analysis and milestone-based escrow. We are powered by the ARC Network, enabling real yield for contributors."
    },
    {
        keywords: ['vault', 'yield', 'earn', 'income'],
        response: "Our Vaults allow you to earn passive income. We offer institutional-grade yield on ARC for:\n• USDC\n• EURC\n• USYC"
    },
    {
        keywords: ['network', 'chain', 'arc'],
        response: "We operate exclusively on the ARC Testnet, utilizing USDC for gas and supporting institutional stablecoins."
    },
    {
        keywords: ['risk', 'safety', 'audit', 'ai'],
        response: "We use AI to analyze campaign legitimacy and developer reputation in real-time. This helps prevent fraud and ensures your donations are safer."
    },
    {
        keywords: ['crowd', 'fund', 'campaign', 'donate'],
        response: "You can explore active campaigns in the 'EXPLORE' tab. Donations are held in escrow and released only when milestones are met."
    }
];

export default function ChatBot() {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([
        { id: '1', text: "Hi! How can I help you with Bestow today?", sender: 'bot', timestamp: new Date() }
    ]);
    const [input, setInput] = useState("");
    const [isTyping, setIsTyping] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isOpen]);

    const handleSend = async () => {
        if (!input.trim()) return;

        const userMsg: Message = {
            id: Date.now().toString(),
            text: input,
            sender: 'user',
            timestamp: new Date()
        };

        setMessages(prev => [...prev, userMsg]);
        setInput("");
        setIsTyping(true);

        // Simulate AI processing delay
        setTimeout(() => {
            const lowerInput = userMsg.text.toLowerCase();
            let response = "I'm not sure about that. Try asking about 'Yield', 'Networks', or 'Safety'.";

            for (const entry of KNOWLEDGE_BASE) {
                if (entry.keywords.some(k => lowerInput.includes(k))) {
                    response = entry.response;
                    break;
                }
            }

            const botMsg: Message = {
                id: (Date.now() + 1).toString(),
                text: response,
                sender: 'bot',
                timestamp: new Date()
            };

            setMessages(prev => [...prev, botMsg]);
            setIsTyping(false);
        }, 1000);
    };

    return (
        <>
            <div style={{ position: 'fixed', bottom: '24px', right: '24px', zIndex: 1000 }}>
                <AnimatePresence>
                    {isOpen && (
                        <motion.div
                            initial={{ opacity: 0, y: 20, scale: 0.9 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 20, scale: 0.9 }}
                            className="glass-panel"
                            style={{
                                width: '350px',
                                height: '500px',
                                marginBottom: '16px',
                                display: 'flex',
                                flexDirection: 'column',
                                overflow: 'hidden',
                                background: 'var(--bg-primary)',
                                boxShadow: '0 8px 32px rgba(0,0,0,0.2)'
                            }}
                        >
                            {/* Header */}
                            <div style={{ padding: '16px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-secondary)' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <Bot size={20} color="var(--accent)" />
                                    <span style={{ fontWeight: 600 }}>Bestow AI</span>
                                </div>
                                <button onClick={() => setIsOpen(false)} style={{ background: 'none', color: 'var(--text-secondary)' }}>
                                    <X size={20} />
                                </button>
                            </div>

                            {/* Messages */}
                            <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                {messages.map((msg) => (
                                    <div
                                        key={msg.id}
                                        style={{
                                            alignSelf: msg.sender === 'user' ? 'flex-end' : 'flex-start',
                                            maxWidth: '80%',
                                            padding: '12px',
                                            borderRadius: '12px',
                                            background: msg.sender === 'user' ? 'var(--accent)' : 'var(--bg-secondary)',
                                            color: msg.sender === 'user' ? 'white' : 'var(--text-primary)',
                                            fontSize: '0.9rem',
                                            lineHeight: '1.4',
                                            borderBottomRightRadius: msg.sender === 'user' ? '4px' : '12px',
                                            borderBottomLeftRadius: msg.sender === 'bot' ? '4px' : '12px',
                                            whiteSpace: 'pre-line'
                                        }}
                                    >
                                        {msg.text}
                                    </div>
                                ))}
                                {isTyping && (
                                    <div style={{ alignSelf: 'flex-start', padding: '12px', background: 'var(--bg-secondary)', borderRadius: '12px', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                                        Generating response...
                                    </div>
                                )}
                                <div ref={messagesEndRef} />
                            </div>

                            {/* Input */}
                            <div style={{ padding: '16px', borderTop: '1px solid var(--border)', display: 'flex', gap: '8px' }}>
                                <input
                                    type="text"
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                                    placeholder="Ask about Bestow..."
                                    style={{
                                        flex: 1,
                                        padding: '8px 12px',
                                        borderRadius: '8px',
                                        border: '1px solid var(--border)',
                                        background: 'var(--bg-secondary)',
                                        color: 'var(--text-primary)',
                                        outline: 'none'
                                    }}
                                />
                                <button
                                    onClick={handleSend}
                                    disabled={!input.trim()}
                                    style={{
                                        padding: '8px',
                                        borderRadius: '8px',
                                        background: input.trim() ? 'var(--accent)' : 'var(--bg-secondary)',
                                        color: input.trim() ? 'white' : 'var(--text-secondary)',
                                        cursor: input.trim() ? 'pointer' : 'default'
                                    }}
                                >
                                    <Send size={18} />
                                </button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setIsOpen(!isOpen)}
                    style={{
                        width: '56px',
                        height: '56px',
                        borderRadius: '50%',
                        background: 'var(--accent)',
                        color: 'white',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 4px 12px var(--accent-glow)',
                        marginLeft: 'auto'
                    }}
                >
                    {isOpen ? <X size={24} /> : <MessageSquare size={24} />}
                </motion.button>
            </div>
        </>
    );
}
