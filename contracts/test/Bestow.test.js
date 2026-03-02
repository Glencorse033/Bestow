const { expect } = require("chai");
const { ethers, upgrades } = require("hardhat");

describe("Bestow Protocol", function () {
    let BestowHub, bestowHub, BestowVault, bestowedVault, Campaign, campaign;
    let owner, creator, donor, otherAccount, oracle;

    beforeEach(async function () {
        [owner, creator, donor, otherAccount, oracle] = await ethers.getSigners();

        // Deploy BestowHub (as UUPS Proxy)
        BestowHub = await ethers.getContractFactory("BestowHub");
        bestowHub = await upgrades.deployProxy(BestowHub, [owner.address], { kind: 'uups', initializer: 'initialize' });
        await bestowHub.waitForDeployment();

        // Set the Oracle signer for testing Fix #2
        await bestowHub.connect(owner).setOracleSigner(oracle.address);

        // Deploy BestowVault4626 (as UUPS Proxy)
        const USDC_MOCK = "0x3600000000000000000000000000000000000000"; // Address format
        BestowVault = await ethers.getContractFactory("BestowVault4626");
        bestowedVault = await upgrades.deployProxy(BestowVault, [
            USDC_MOCK,
            "USDC Yield Alpha",
            "bUSDC",
            owner.address
        ], { kind: 'uups', initializer: 'initialize' });
        await bestowedVault.waitForDeployment();
    });

    describe("BestowHub", function () {
        it("Should create a new campaign", async function () {
            const timestamp = Math.floor(Date.now() / 1000);
            const targetStr = "10000000000000000000"; // 10 ether

            // Generate valid Oracle Signature (matches /api/analyze-risk route logic)
            const messageHash = ethers.solidityPackedKeccak256(
                ["string", "uint256", "uint256", "string", "uint256", "address"],
                ["Social Cause", targetStr, 10, "Low", timestamp, creator.address]
            );
            const signature = await oracle.signMessage(ethers.getBytes(messageHash));

            await expect(bestowHub.connect(creator).createCampaign(
                "Social Cause",
                "A very long description that must be at least 50 characters long to pass validation.",
                "ipfs://mock-image",
                ethers.parseEther("10"),
                30,
                ["Milestone 1"],
                [100],
                10,
                "Low",
                signature,
                timestamp
            )).to.emit(bestowHub, "CampaignCreated");

            const campaigns = await bestowHub.getCampaigns();
            expect(campaigns.length).to.equal(1);
            expect(campaigns[0].title).to.equal("Social Cause");
            expect(campaigns[0].creator).to.equal(creator.address);
        });
    });

    describe("Campaign", function () {
        beforeEach(async function () {
            const timestamp = Math.floor(Date.now() / 1000);
            const targetStr = "10000000000000000000"; // 10 ether

            // Generate valid Oracle Signature (matches /api/analyze-risk route logic)
            const messageHash = ethers.solidityPackedKeccak256(
                ["string", "uint256", "uint256", "string", "uint256", "address"],
                ["Social Cause", targetStr, 10, "Low", timestamp, creator.address]
            );
            const signature = await oracle.signMessage(ethers.getBytes(messageHash));

            const tx = await bestowHub.connect(creator).createCampaign(
                "Social Cause",
                "A very long description that must be at least 50 characters long to pass validation.",
                "ipfs://mock-image",
                ethers.parseEther("10"),
                30,
                ["Milestone 1"],
                [100],
                10,
                "Low",
                signature,
                timestamp
            );
            await tx.wait();

            // In a real scenario we'd get the address from the event
            const campaigns = await bestowHub.getCampaigns();
            const campaignAddress = campaigns[0].campaignAddress;

            Campaign = await ethers.getContractFactory("Campaign");
            campaign = Campaign.attach(campaignAddress);
        });

        it("Should accept donations", async function () {
            const donation = ethers.parseEther("1"); // 1 USDC (1e18 mock for now, but 1e6 normally)
            const netDonation = donation - ((donation * 100n) / 10000n); // 1% fee = 100 bps

            // Fix #9 requires msg.value >= 1e6 MIN_DONATION which 1 ether passes
            await expect(campaign.connect(donor).donate({ value: donation }))
                .to.emit(campaign, "DonationReceived")
                .withArgs(donor.address, netDonation);

            expect(await campaign.totalRaised()).to.equal(netDonation);
        });
    });

    describe("BestowVault", function () {
        it("Should acknowledge vault deployment", async function () {
            expect(await bestowedVault.getAddress()).to.not.equal(ethers.ZeroAddress);
        });
    });
});
