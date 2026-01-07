# Bestow - Decentralized Crowdfunding on ARC Network

Welcome to **Bestow**! This is a cutting-edge dApp tailored for the ARC Network.

## Project Structure
- `contracts/`: Hardhat project for Smart Contracts.
- `web/`: Next.js 14 Frontend with Premium UI.

## Prerequisites
- Node.js (v18+)
- MetaMask (Connected to ARC, Soneium, or Ink Testnets)

## Network Details
- **ARC Testnet**: Chain ID 5042002 (Gas: USDC)
- **Soneium Mainnet**: Chain ID 1868 (Gas: ETH)
- **Ink Mainnet**: Chain ID 57073 (Gas: ETH)

## Setup Instructions

### 1. Smart Contracts
Navigate to the contracts folder and install dependencies:
```bash
cd contracts
npm install
```

Compile the contracts:
```bash
npx hardhat compile
```

(Optional) Run tests:
```bash
npx hardhat test
```

### 2. Frontend
Navigate to the web folder and install dependencies:
```bash
cd ../web
npm install
```

Start the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the app.

## Features Implemented
- **Premium UI**: Glassmorphism, animations, custom fonts.
- **Theme Support**: Toggle between Light and Dark modes.
- **Wallet Connection**: Connect to MetaMask.
- **Smart Contracts**: Campaign creation and contribution logic compatible with ARC's USDC gas token.

---

## 🔰 Beginner's Guide: How to Start the App

If this is your first time running a dApp (Decentralized App), follow these simple steps:

### Step 1: Open Your Terminal
1.  Press the **Windows Key** on your keyboard.
2.  Type `PowerShell` or `Command Prompt` and press **Enter**.

### Step 2: Go to the Project Folder
Copy and paste this command into your terminal and press **Enter**:
```bash
cd C:\Users\USER\.gemini\antigravity\scratch\bestow\web
```

### Step 3: Install the "Brains" (Dependencies)
This downloads the tools the app needs to work. Copy, paste, and run:
```bash
npm install
```
*(You will see a lot of text scrolling. Wait for it to finish.)*

### Step 4: Turn on the App
This starts the local "server" so you can see the website. Copy, paste, and run:
```bash
npm run dev
```

### Step 5: View the App
1.  Look at the terminal. It should say **"Ready in ..."** or show a link like `http://localhost:3000`.
2.  Open your web browser (Chrome, Edge, etc.).
3.  Go to this address: [http://localhost:3000](http://localhost:3000)

**That's it! You are now viewing the Bestow app.**

