// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "./Campaign.sol";

interface ICampaign {
    function pause() external;
    function unpause() external;
}

contract BestowHub is Initializable, OwnableUpgradeable, PausableUpgradeable, UUPSUpgradeable {
    address public treasury;
    address public campaignVault;
    uint256 public platformFeeBps; // 1% default
    address public oracleSigner;

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(address initialOwner) public initializer {
        __Ownable_init(initialOwner);
        __Pausable_init();

        treasury = initialOwner;
        platformFeeBps = 100; // 1%
    }

    function _authorizeUpgrade(address newImplementation) internal override onlyOwner {}

    function setOracleSigner(address _signer) external onlyOwner {
        oracleSigner = _signer;
    }

    function setCampaignVault(address _vault) external onlyOwner {
        campaignVault = _vault;
    }

    struct CampaignInfo {
        address campaignAddress;
        string title;
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
        string memory _image,
        uint256 _target,
        uint256 _durationInDays,
        string[] memory _milestoneDescs,
        uint256[] memory _milestonePcts,
        uint256 _riskScore,
        string memory _riskLevel,
        bytes memory oracleSignature,
        uint256 timestamp
    ) external whenNotPaused {
        // Input validation
        require(bytes(_title).length > 0 && bytes(_title).length <= 100, "HUB:TITLE_LEN");
        require(bytes(_description).length >= 50 && bytes(_description).length <= 2000, "HUB:DESC_LEN");
        require(_target > 0, "HUB:TARGET_0");
        require(_durationInDays >= 1 && _durationInDays <= 365, "HUB:DUR_LEN");
        require(_milestoneDescs.length <= 10, "HUB:MILE_COUNT");
        
        // SECURITY FIX: Client-Side Score Forgery
        require(oracleSigner != address(0), "Oracle not set");
        bytes32 messageHash = keccak256(abi.encodePacked(
            _title, _target, _riskScore, _riskLevel, timestamp, msg.sender
        ));
        bytes32 ethSignedHash = MessageHashUtils.toEthSignedMessageHash(messageHash);
        require(
            ECDSA.recover(ethSignedHash, oracleSignature) == oracleSigner,
            "Invalid oracle signature"
        );
        require(block.timestamp <= timestamp + 5 minutes, "Signature expired");

        uint256 deadline = block.timestamp + (_durationInDays * 1 days);
        Campaign newCampaign = new Campaign(
            _title,
            _description,
            _image,
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

    // Admin Functions
    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }

    function setTreasury(address _treasury) external onlyOwner {
        require(_treasury != address(0), "Invalid address");
        treasury = _treasury;
    }

    function setPlatformFee(uint256 _feeBps) external onlyOwner {
        require(_feeBps <= 1000, "Max fee 10%");
        platformFeeBps = _feeBps;
    }

    // SECURITY FIX: Unpausable Pausable Contracts
    function pauseCampaign(address _campaignAddress) external onlyOwner {
        ICampaign(_campaignAddress).pause();
    }

    function unpauseCampaign(address _campaignAddress) external onlyOwner {
        ICampaign(_campaignAddress).unpause();
    }
}
