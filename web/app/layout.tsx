'use client';

import './globals.css';
import { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import ChatBot from '../components/ChatBot';
import PriceTicker from '../components/PriceTicker';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [theme, setTheme] = useState('dark');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  return (
    <html lang="en">
      <head>
        <title>Bestow | Decentralized Crowdfunding</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body>
        <div className="app-wrapper">
          <PriceTicker />
          <Navbar theme={theme} toggleTheme={toggleTheme} />
          <main style={{ minHeight: 'calc(100vh - 300px)' }}>{children}</main>
          <ChatBot />
          <Footer />
        </div>
      </body>
    </html>
  );
}
