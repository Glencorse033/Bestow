const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Bestow Protocol", function () {
    let BestowHub, bestowHub, BestowVault, bestowedVault, Campaign, campaign;
    let owner, creator, donor, otherAccount;

    beforeEach(async function () {
        [owner, creator, donor, otherAccount] = await ethers.getSigners();

        // Deploy BestowHub
        BestowHub = await ethers.getContractFactory("BestowHub");
        bestowHub = await BestowHub.deploy();
        await bestowHub.waitForDeployment();

        // Deploy BestowVault
        BestowVault = await ethers.getContractFactory("BestowVault");
        bestowedVault = await BestowVault.deploy(
            "USDC Yield Alpha",
            "USDC",
            1, // 1 second lockup for testing
            1250 // 12.5% APY
        );
        await bestowedVault.waitForDeployment();
    });

    describe("BestowHub", function () {
        it("Should create a new campaign", async function () {
            await expect(bestowHub.connect(creator).createCampaign(
                "Social Cause",
                "A very long description that must be at least 50 characters long to pass validation.",
                ethers.parseEther("10"),
                30,
                ["Milestone 1"],
                [100],
                10,
                "Low"
            )).to.emit(bestowHub, "CampaignCreated");

            const campaigns = await bestowHub.getCampaigns();
            expect(campaigns.length).to.equal(1);
            expect(campaigns[0].title).to.equal("Social Cause");
            expect(campaigns[0].creator).to.equal(creator.address);
        });
    });

    describe("Campaign", function () {
        beforeEach(async function () {
            const tx = await bestowHub.connect(creator).createCampaign(
                "Social Cause",
                "A very long description that must be at least 50 characters long to pass validation.",
                ethers.parseEther("10"),
                30,
                ["Milestone 1"],
                [100],
                10,
                "Low"
            );
            const receipt = await tx.wait();

            // In a real scenario we'd get the address from the event
            const campaigns = await bestowHub.getCampaigns();
            const campaignAddress = campaigns[0].campaignAddress;

            Campaign = await ethers.getContractFactory("Campaign");
            campaign = Campaign.attach(campaignAddress);
        });

        it("Should accept donations", async function () {
            const donation = ethers.parseEther("1");
            await expect(campaign.connect(donor).donate({ value: donation }))
                .to.emit(campaign, "DonationReceived")
                .withArgs(donor.address, donation);

            expect(await campaign.totalRaised()).to.equal(donation);
        });

        it("Should allow withdrawal by creator if target reached", async function () {
            const donation = ethers.parseEther("10");
            await campaign.connect(donor).donate({ value: donation });

            const initialBalance = await ethers.provider.getBalance(creator.address);
            await campaign.connect(creator).withdraw();
            const finalBalance = await ethers.provider.getBalance(creator.address);

            expect(finalBalance).to.be.gt(initialBalance);
            expect(await campaign.claimed()).to.be.true;
        });
    });

    describe("BestowVault", function () {
        it("Should allow deposits", async function () {
            const depositAmount = ethers.parseEther("5");
            await expect(bestowedVault.connect(donor).deposit({ value: depositAmount }))
                .to.emit(bestowedVault, "Deposited")
                .withArgs(donor.address, depositAmount);

            const position = await bestowedVault.getPosition(donor.address);
            expect(position.amount).to.equal(depositAmount);
        });

        it("Should allow withdrawals after lockup", async function () {
            const depositAmount = ethers.parseEther("5");
            await bestowedVault.connect(donor).deposit({ value: depositAmount });

            // Fund the reward pool as owner
            await bestowedVault.connect(owner).refillRewards({ value: ethers.parseEther("1") });

            // Wait for lockup (1 second)
            await new Promise(resolve => setTimeout(resolve, 1500));

            const initialBalance = await ethers.provider.getBalance(donor.address);
            await bestowedVault.connect(donor).withdraw(depositAmount);
            const finalBalance = await ethers.provider.getBalance(donor.address);

            expect(finalBalance).to.be.gt(initialBalance);
        });
    });
});
