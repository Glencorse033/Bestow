// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

interface IBestowHub {
    function treasury() external view returns (address);
    function platformFeeBps() external view returns (uint256);
    function owner() external view returns (address);
    function campaignVault() external view returns (address);
}

interface IBestowVault {
    function deposit() external payable;
    function withdraw(uint256 amount) external;
    function calculateYield(address user) external view returns (uint256);
    function getPosition(address user) external view returns (uint256 amount, uint256 unlockTime, uint256 pendingYield, uint256 currentAPY);
}

contract Campaign is ReentrancyGuard, Pausable {
    struct Milestone {
        string description;
        uint256 offsetPercent;
        bool completed;
    }

    struct RiskInfo {
        uint256 score;
        string level;
    }

    string public title;
    string public description;
    uint256 public target;
    uint256 public deadline;
    address public creator;
    uint256 public totalRaised;
    uint256 public totalClaimed;
    bool public claimed; // Kept for backward compatibility, but we now use totalClaimed
    address public hub;
    bool public inVault;

    Milestone[] public milestones;
    RiskInfo public riskProfile;

    mapping(address => uint256) public contributions;

    event DonationReceived(address indexed donor, uint256 amount);
    event FundsWithdrawn(address indexed creator, uint256 amount);

    constructor(
        string memory _title,
        string memory _description,
        uint256 _target,
        uint256 _deadline,
        address _creator,
        string[] memory _milestoneDescs,
        uint256[] memory _milestonePcts,
        uint256 _riskScore,
        string memory _riskLevel
    ) {
        title = _title;
        description = _description;
        target = _target;
        deadline = _deadline;
        creator = _creator;
        hub = msg.sender;
        
        riskProfile = RiskInfo(_riskScore, _riskLevel);

        require(_milestoneDescs.length == _milestonePcts.length, "Milestone mismatch");
        uint256 totalPct = 0;
        for (uint i = 0; i < _milestoneDescs.length; i++) {
            totalPct += _milestonePcts[i];
            milestones.push(Milestone({
                description: _milestoneDescs[i],
                offsetPercent: _milestonePcts[i],
                completed: false
            }));
        }
        require(totalPct == 100, "Milestones must sum to 100%");
    }

    // Since ARC uses USDC as gas, we use msg.value to accept native token (USDC)
    function donate() external payable whenNotPaused nonReentrant {
        require(block.timestamp < deadline, "Campaign ended");
        require(msg.value > 0, "Donation must be > 0");

        uint256 feeBps = IBestowHub(hub).platformFeeBps();
        uint256 fee = (msg.value * feeBps) / 10000;
        uint256 netDonation = msg.value - fee;

        if (fee > 0) {
            (bool success, ) = payable(IBestowHub(hub).treasury()).call{value: fee}("");
            require(success, "Fee transfer failed");
        }

        contributions[msg.sender] += netDonation;
        totalRaised += netDonation;

        emit DonationReceived(msg.sender, netDonation);
    }

    function withdraw() external nonReentrant {
        require(msg.sender == creator, "Only creator can withdraw");
        require(totalRaised >= target, "Target not reached");

        uint256 claimablePct = 0;
        for (uint i = 0; i < milestones.length; i++) {
            if (milestones[i].completed) {
                claimablePct += milestones[i].offsetPercent;
            }
        }

        uint256 totalAvailable = (totalRaised * claimablePct) / 100;
        uint256 amountToWithdraw = totalAvailable - totalClaimed;
        
        require(amountToWithdraw > 0, "No funds available for withdrawal");

        if (inVault) {
            address vault = IBestowHub(hub).campaignVault();
            IBestowVault(vault).withdraw(amountToWithdraw);
        }

        totalClaimed += amountToWithdraw;
        if (totalClaimed >= totalRaised) {
            claimed = true;
        }

        (bool success, ) = payable(creator).call{value: amountToWithdraw}("");
        require(success, "Withdrawal failed");
        
        emit FundsWithdrawn(creator, amountToWithdraw);
    }

    function completeMilestone(uint256 index) external {
        require(msg.sender == hub || msg.sender == IBestowHub(hub).owner(), "Unauthorized");
        require(index < milestones.length, "Invalid index");
        require(!milestones[index].completed, "Already completed");

        milestones[index].completed = true;
    }

    function activateEscrowYield() external nonReentrant {
        require(totalRaised >= target, "Target not reached");
        require(!inVault, "Already in vault");
        address vault = IBestowHub(hub).campaignVault();
        require(vault != address(0), "No vault configured");

        inVault = true;
        uint256 balance = address(this).balance;
        IBestowVault(vault).deposit{value: balance}();
    }

    // Real Yield Function - queries the designated vault
    function getEstimatedYield(address contributor) external view returns (uint256) {
        address vault = IBestowHub(hub).campaignVault();
        if (vault == address(0)) {
            // Fallback to minimal yield if no vault
            return contributions[contributor] * 1 / 100;
        }
        
        // In a complex app, we'd track shares, but for this MVP 
        // we calculate the contributor's share of the vault yield
        uint256 totalYield = IBestowVault(vault).calculateYield(address(this));
        if (totalRaised == 0) return 0;
        return (totalYield * contributions[contributor]) / totalRaised;
    }
}
