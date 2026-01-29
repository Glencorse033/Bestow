// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./Campaign.sol";

contract BestowHub {
    struct CampaignInfo {
        address campaignAddress;
        string title;
        string description;
        uint256 target;
        uint256 deadline;
        address creator;
        uint256 riskScore;
    }

    CampaignInfo[] public campaigns;

    event CampaignCreated(address indexed campaignAddress, string title, address indexed creator);

    function createCampaign(
        string memory _title,
        string memory _description,
        uint256 _target,
        uint256 _durationInDays,
        string[] memory _milestoneDescs,
        uint256[] memory _milestonePcts,
        uint256 _riskScore,
        string memory _riskLevel
    ) external {
        // Input validation
        require(bytes(_title).length > 0 && bytes(_title).length <= 100, "Title must be 1-100 chars");
        require(bytes(_description).length >= 50 && bytes(_description).length <= 2000, "Description must be 50-2000 chars");
        require(_target > 0, "Target must be > 0");
        require(_durationInDays >= 1 && _durationInDays <= 365, "Duration must be 1-365 days");
        require(_milestoneDescs.length <= 10, "Max 10 milestones");
        
        uint256 deadline = block.timestamp + (_durationInDays * 1 days);
        Campaign newCampaign = new Campaign(
            _title,
            _description,
            _target,
            deadline,
            msg.sender,
            _milestoneDescs,
            _milestonePcts,
            _riskScore,
            _riskLevel
        );

        campaigns.push(CampaignInfo({
            campaignAddress: address(newCampaign),
            title: _title,
            description: _description,
            target: _target,
            deadline: deadline,
            creator: msg.sender,
            riskScore: _riskScore
        }));

        emit CampaignCreated(address(newCampaign), _title, msg.sender);
    }

    function getCampaigns() external view returns (CampaignInfo[] memory) {
        return campaigns;
    }
}
