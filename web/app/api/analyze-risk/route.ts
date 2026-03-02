import { NextResponse } from 'next/server';
import { ethers } from 'ethers';

const SCAM_CLUSTERS = [
    { name: 'Phishing Keywords', keywords: ['vitalik', 'elon', 'password', 'private key', 'giveaway'], weight: 40 },
    { name: 'Unrealistic Returns', keywords: ['guaranteed', '100%', 'double your', 'no risk', 'daily profit'], weight: 35 },
    { name: 'Urgency Pressure', keywords: ['urgent', 'act now', 'last chance', 'limited time'], weight: 15 }
];

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { title, description, goal, creatorAddress } = body;

        // Perform AI Risk Analysis
        let score = 0;
        const flags: string[] = [];
        const lowerDesc = description.toLowerCase();
        const lowerTitle = title.toLowerCase();

        // 1. Cluster Analysis
        SCAM_CLUSTERS.forEach(cluster => {
            const found = cluster.keywords.filter(k => lowerDesc.includes(k) || lowerTitle.includes(k));
            if (found.length > 0) {
                score += cluster.weight;
                flags.push(`Matched ${cluster.name}: "${found.join(', ')}"`);
            }
        });

        // 2. Sustainability Analysis
        const wordCount = description.split(' ').length;
        if (goal > 50000 && wordCount < 30) {
            score += 25;
            flags.push("High funding goal with minimal project detail");
        }

        // 3. Formatting
        if (description.length > 20 && description === description.toUpperCase()) {
            score += 20;
            flags.push("Non-professional formatting (ALL CAPS)");
        }

        if (description.length < 50) {
            score += 15;
            flags.push("Description is too short for verification");
        }

        // Determine Level
        let level = 'LOW';
        if (score >= 70) level = 'CRITICAL';
        else if (score >= 45) level = 'HIGH';
        else if (score >= 20) level = 'MEDIUM';

        const finalScore = Math.min(score, 100);

        // Current Timestamp
        const timestamp = Math.floor(Date.now() / 1000);

        // Server-side Signing
        const privateKey = process.env.ORACLE_SIGNER_PRIVATE_KEY;
        if (!privateKey) {
            throw new Error("Missing ORACLE_SIGNER_PRIVATE_KEY");
        }

        const signer = new ethers.Wallet(privateKey);

        // Security Fix: Sign matching payload structure in Hub
        // keccak256(abi.encodePacked(_title, _target, _riskScore, _riskLevel, timestamp, msg.sender))
        const messageHash = ethers.solidityPackedKeccak256(
            ["string", "uint256", "uint256", "string", "uint256", "address"],
            [title, ethers.parseEther(goal.toString()), finalScore, level, timestamp, creatorAddress]
        );

        const signature = await signer.signMessage(ethers.getBytes(messageHash));

        return NextResponse.json({
            riskScore: finalScore,
            riskLevel: level,
            signature,
            timestamp,
            flags
        });

    } catch (error: any) {
        console.error("Oracle Signer Error:", error);
        return NextResponse.json({ error: "Failed to generate AI Risk Score" }, { status: 500 });
    }
}
