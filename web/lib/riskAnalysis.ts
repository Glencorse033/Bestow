// lib/riskAnalysis.ts

export interface RiskReport {
    score: number; // 0-100, where 100 is failing/high risk
    level: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    flags: string[];
    summary: string;
}

const RED_FLAGS = [
    'guaranteed', '100%', 'giveaway', 'double your', 'no risk',
    'urgent', 'act now', 'vitalik', 'elon', 'password', 'private key'
];

export const analyzeRisk = async (title: string, description: string, goal: number): Promise<RiskReport> => {
    // Simulate API delay
    await new Promise(r => setTimeout(r, 1500));

    let score = 0;
    const flags: string[] = [];
    const lowerDesc = description.toLowerCase();
    const lowerTitle = title.toLowerCase();

    // 1. Keyword Analysis
    RED_FLAGS.forEach(flag => {
        if (lowerDesc.includes(flag) || lowerTitle.includes(flag)) {
            score += 20;
            flags.push(`Contains suspicious keyword: "${flag}"`);
        }
    });

    // 2. Length Analysis (Too short is suspicious for a crowdfunding project)
    if (description.length < 50) {
        score += 30;
        flags.push("Description is dangerously short");
    } else if (description.length < 100) {
        score += 10;
        flags.push("Description lacks detail");
    }

    // 3. Goal Analysis (Unrealistic goals)
    if (goal > 1000000) {
        score += 15;
        flags.push("Extremely high funding goal for a new project");
    }

    // 4. Formatting Analysis (ALL CAPS is suspicious)
    if (description === description.toUpperCase() && description.length > 20) {
        score += 25;
        flags.push("Excessive use of capitalization");
    }

    // Determine Level
    let level: RiskReport['level'] = 'LOW';
    if (score >= 80) level = 'CRITICAL';
    else if (score >= 50) level = 'HIGH';
    else if (score >= 20) level = 'MEDIUM';

    // Generate Summary
    let summary = "Campaign appears legitimate.";
    if (level === 'CRITICAL') summary = "DO NOT INTERACT. This campaign exhibits multiple signs of potential fraud.";
    else if (level === 'HIGH') summary = "Proceed with caution. The campaign has several red flags.";
    else if (level === 'MEDIUM') summary = "Some elements require verification. Please research the team.";

    return { score: Math.min(score, 100), level, flags, summary };
};
