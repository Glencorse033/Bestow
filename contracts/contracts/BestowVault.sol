// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract BestowVault {
    string public name;
    string public asset; // e.g. "USDC"
    uint256 public totalDeposits;
    uint256 public lockupDuration; // in seconds
    uint256 public APY; // in basis points, e.g. 500 = 5%

    struct Deposit {
        uint256 amount;
        uint256 timestamp;
        uint256 lastClaim;
    }

    mapping(address => Deposit) public deposits;

    event Deposited(address indexed user, uint256 amount);
    event Withdrawn(address indexed user, uint256 amount, uint256 yield);
    event YieldClaimed(address indexed user, uint256 amount);

    constructor(string memory _name, string memory _asset, uint256 _lockupDuration, uint256 _apy) {
        name = _name;
        asset = _asset;
        lockupDuration = _lockupDuration;
        APY = _apy;
    }

    // Interactive Functions

    function deposit() external payable {
        require(msg.value > 0, "Amount must be > 0");

        Deposit storage userDeposit = deposits[msg.sender];
        
        // If existing deposit, claim yield first (simplified)
        if (userDeposit.amount > 0) {
            uint256 pending = calculateYield(msg.sender);
            if (pending > 0) {
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

    function withdraw(uint256 amount) external {
        Deposit storage userDeposit = deposits[msg.sender];
        require(userDeposit.amount >= amount, "Insufficient balance");
        require(block.timestamp >= userDeposit.timestamp + lockupDuration, "Funds are locked");

        // Calculate and transfer yield
        uint256 pending = calculateYield(msg.sender);
        if (pending > 0) {
            payable(msg.sender).transfer(pending);
             userDeposit.lastClaim = block.timestamp; // Reset yield timer
             emit YieldClaimed(msg.sender, pending);
        }

        userDeposit.amount -= amount;
        totalDeposits -= amount;
        
        payable(msg.sender).transfer(amount);
        emit Withdrawn(msg.sender, amount, pending);
    }

    // View Functions

    function calculateYield(address user) public view returns (uint256) {
        Deposit memory userDeposit = deposits[user];
        if (userDeposit.amount == 0) return 0;

        uint256 timeElapsed = block.timestamp - userDeposit.lastClaim;
        // Simple interest: Principal * Rate * Time
        // Rate is APY / 10000
        // Time is seconds / secondsInYear
        
        uint256 yield = (userDeposit.amount * APY * timeElapsed) / (10000 * 365 days);
        return yield;
    }

    function getPosition(address user) external view returns (uint256 amount, uint256 unlockTime, uint256 pendingYield) {
        Deposit memory d = deposits[user];
        return (d.amount, d.timestamp + lockupDuration, calculateYield(user));
    }
}
