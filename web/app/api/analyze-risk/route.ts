import { NextResponse } from 'next/server';
import { ethers } from 'ethers';
import { GoogleGenAI } from '@google/genai';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { title, description, goal, creatorAddress } = body;

        if (!process.env.GEMINI_API_KEY) {
            console.error("Missing GEMINI_API_KEY environment variable");
            throw new Error("Missing GEMINI_API_KEY");
        }
        const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

        // Perform AI Risk Analysis
        const prompt = `
            You are a Web3 security AI scoring risk for a Web3 crowdfunding platform called Bestow on the ARC blockchain.
            Analyze this campaign proposal and output ONLY a JSON object with this exact structure:
            { "score": <number 0-100>, "flags": ["List", "Of", "Warning", "Signals"] }
            
            Campaign Title: ${title}
            Campaign Goal: ${goal} USDC
            Description Length: ${description.length} chars
            Description Snippet: ${description.substring(0, 500)}

            Scoring context:
            - Unrealistic APY promises, buzzwords like "guaranteed 10X", "elon", or "giveaway" should heavily increase the score (scam indication).
            - Empty or extremely brief descriptions seeking high funding amounts are high risk.
            - Reasonable, clear, utility-focused projects get a low score closer to 0.
        `;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: 'application/json',
            }
        });

        const aiOutput = response.text || "{}";
        let aiData;
        try {
            aiData = JSON.parse(aiOutput);
        } catch (e) {
            console.error("Failed to parse Gemini JSON:", aiOutput);
            aiData = { score: 99, flags: ["Error parsing AI response"] };
        }

        const score = aiData.score || 0;
        const flags = aiData.flags || [];

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
