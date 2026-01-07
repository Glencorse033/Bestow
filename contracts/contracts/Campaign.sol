// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract Campaign {
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
    bool public claimed;

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
        
        riskProfile = RiskInfo(_riskScore, _riskLevel);

        require(_milestoneDescs.length == _milestonePcts.length, "Milestone mismatch");
        for (uint i = 0; i < _milestoneDescs.length; i++) {
            milestones.push(Milestone({
                description: _milestoneDescs[i],
                offsetPercent: _milestonePcts[i],
                completed: false
            }));
        }
    }

    // Since ARC uses USDC as gas, we use msg.value to accept native token (USDC)
    function donate() external payable {
        require(block.timestamp < deadline, "Campaign ended");
        require(msg.value > 0, "Donation must be > 0");

        contributions[msg.sender] += msg.value;
        totalRaised += msg.value;

        emit DonationReceived(msg.sender, msg.value);
    }

    function withdraw() external {
        require(msg.sender == creator, "Only creator can withdraw");
        require(totalRaised >= target, "Target not reached");
        require(!claimed, "Already claimed");

        claimed = true;
        payable(creator).transfer(address(this).balance);
        
        emit FundsWithdrawn(creator, address(this).balance);
    }

    // Mock Yield Function for demonstration
    // in a real app this would interact with a lending protocol
    function getEstimatedYield(address contributor) external view returns (uint256) {
        // Mock: 5% "yield"
        return contributions[contributor] * 5 / 100;
    }
}
