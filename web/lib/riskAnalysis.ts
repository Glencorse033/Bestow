// lib/riskAnalysis.ts

export interface RiskReport {
    score: number; // 0-100, where 100 is failing/high risk
    level: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    flags: string[];
    summary: string;
}

const SCAM_CLUSTERS = [
    { name: 'Phishing Keywords', keywords: ['vitalik', 'elon', 'password', 'private key', 'giveaway'], weight: 40 },
    { name: 'Unrealistic Returns', keywords: ['guaranteed', '100%', 'double your', 'no risk', 'daily profit'], weight: 35 },
    { name: 'Urgency Pressure', keywords: ['urgent', 'act now', 'last chance', 'limited time'], weight: 15 }
];

export const analyzeRisk = async (title: string, description: string, goal: number): Promise<RiskReport> => {
    // Simulate API delay (representing an LLM call)
    await new Promise(r => setTimeout(r, 1500));

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

    // 2. Sustainability Analysis (Goal vs. Detail)
    const wordCount = description.split(' ').length;
    if (goal > 50000 && wordCount < 30) {
        score += 25;
        flags.push("High funding goal with minimal project detail");
    }

    // 3. Formatting/Professionalism
    if (description.length > 20 && description === description.toUpperCase()) {
        score += 20;
        flags.push("Non-professional formatting (ALL CAPS)");
    }

    if (description.length < 50) {
        score += 15;
        flags.push("Description is too short for verification");
    }

    // 4. Social Check (Mocking search for external links)
    const hasLinks = /https?:\/\/[^\s]+/.test(description);
    if (!hasLinks && goal > 10000) {
        score += 10;
        flags.push("Missing external project links (Socials/Github)");
    }

    // Determine Level
    let level: RiskReport['level'] = 'LOW';
    if (score >= 70) level = 'CRITICAL';
    else if (score >= 45) level = 'HIGH';
    else if (score >= 20) level = 'MEDIUM';

    // Generate Summary
    let summary = "Campaign appears legitimate.";
    if (level === 'CRITICAL') summary = "HIGH FRAUD RISK. This campaign matches patterns of known crypto scams.";
    else if (level === 'HIGH') summary = "Proceed with caution. Several sustainability red flags detected.";
    else if (level === 'MEDIUM') summary = "Moderate risk. Verification of project leads is recommended.";

    return { score: Math.min(score, 100), level, flags, summary };
};
