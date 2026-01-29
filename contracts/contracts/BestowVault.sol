// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract BestowVault {
    string public name;
    string public asset; // e.g. "USDC"
    uint256 public totalDeposits;
    uint256 public lockupDuration; // in seconds
    uint256 public APY; // Base APY in basis points (e.g. 1250 = 12.5%)
    address public owner;

    struct Deposit {
        uint256 amount;
        uint256 timestamp;
        uint256 lastClaim;
    }

    mapping(address => Deposit) public deposits;

    event Deposited(address indexed user, uint256 amount);
    event Withdrawn(address indexed user, uint256 amount, uint256 yield);
    event YieldClaimed(address indexed user, uint256 amount);
    event RewardsRefilled(uint256 amount);
    event ParamsUpdated(uint256 newAPY, uint256 newLockup);

    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    constructor(string memory _name, string memory _asset, uint256 _lockupDuration, uint256 _apy) {
        name = _name;
        asset = _asset;
        lockupDuration = _lockupDuration;
        APY = _apy;
        owner = msg.sender;
    }

    // Admin Functions

    function refillRewards() external payable onlyOwner {
        emit RewardsRefilled(msg.value);
    }

    function updateParams(uint256 _newAPY, uint256 _newLockup) external onlyOwner {
        APY = _newAPY;
        lockupDuration = _newLockup;
        emit ParamsUpdated(_newAPY, _newLockup);
    }

    function transferOwnership(address _newOwner) external onlyOwner {
        require(_newOwner != address(0), "Invalid owner");
        owner = _newOwner;
    }

    function emergencyWithdraw() external onlyOwner {
        payable(owner).transfer(address(this).balance);
    }

    // Interactive Functions

    function deposit() external payable {
        require(msg.value > 0, "Amount must be > 0");

        Deposit storage userDeposit = deposits[msg.sender];
        
        // If existing deposit, claim yield first
        if (userDeposit.amount > 0) {
            uint256 pending = calculateYield(msg.sender);
            if (pending > 0) {
                // Ensure contract has enough funds (reward pool)
                require(address(this).balance >= pending, "Insufficient reward pool");
                payable(msg.sender).transfer(pending);
                emit YieldClaimed(msg.sender, pending);
            }
        }

        userDeposit.amount += msg.value;
        userDeposit.timestamp = block.timestamp;
        userDeposit.lastClaim = block.timestamp;
        totalDeposits += msg.value;

        emit Deposited(msg.sender, msg.value);
    }

    // Reentrancy guard
    bool private locked;
    modifier nonReentrant() {
        require(!locked, "Reentrant call");
        locked = true;
        _;
        locked = false;
    }

    function withdraw(uint256 amount) external nonReentrant {
        Deposit storage userDeposit = deposits[msg.sender];
        require(userDeposit.amount >= amount, "Insufficient balance");
        require(block.timestamp >= userDeposit.timestamp + lockupDuration, "Funds are locked");

        // Calculate yield before state changes
        uint256 pending = calculateYield(msg.sender);
        
        // Update state BEFORE external calls
        userDeposit.amount -= amount;
        totalDeposits -= amount;
        userDeposit.lastClaim = block.timestamp;
        
        // Cache total to transfer
        uint256 totalTransfer = amount + pending;
        require(address(this).balance >= totalTransfer, "Insufficient vault balance");
        
        // Single external call at the end
        payable(msg.sender).transfer(totalTransfer);
        
        emit YieldClaimed(msg.sender, pending);
        emit Withdrawn(msg.sender, amount, pending);
    }

    // View Functions

    function getCurrentAPY(address user) public view returns (uint256) {
        Deposit memory userDeposit = deposits[user];
        if (userDeposit.amount == 0) return APY;

        uint256 timeElapsed = block.timestamp - userDeposit.timestamp;
        
        // Tier 3: 90+ days -> 20% (2000 bps)
        if (timeElapsed >= 90 days) return 2000;
        // Tier 2: 30-89 days -> 15% (1500 bps)
        if (timeElapsed >= 30 days) return 1500;
        
        // Tier 1: Base APY
        return APY;
    }

    function calculateYield(address user) public view returns (uint256) {
        Deposit memory userDeposit = deposits[user];
        if (userDeposit.amount == 0) return 0;

        uint256 timeElapsed = block.timestamp - userDeposit.lastClaim;
        uint256 currentAPY = getCurrentAPY(user);
        
        uint256 yield = (userDeposit.amount * currentAPY * timeElapsed) / (10000 * 365 days);
        return yield;
    }

    function getPosition(address user) external view returns (
        uint256 amount, 
        uint256 unlockTime, 
        uint256 pendingYield, 
        uint256 currentAPY
    ) {
        Deposit memory d = deposits[user];
        return (d.amount, d.timestamp + lockupDuration, calculateYield(user), getCurrentAPY(user));
    }
}
