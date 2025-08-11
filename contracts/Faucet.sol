// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract Faucet is Ownable, ReentrancyGuard {
    // Faucet configuration
    uint256 public constant CLAIM_AMOUNT = 0.01 ether;
    uint256 public constant COOLDOWN_PERIOD = 24 hours;
    
    // User claim tracking
    mapping(address => uint256) public lastClaimTime;
    mapping(address => bool) public hasClaimed;
    
    event TokensClaimed(address indexed user, uint256 amount);

    constructor() {
        // Contract will be funded by owner
    }

    // Claim function (user pays gas)
    function claim() external nonReentrant {
        require(!hasClaimed[msg.sender], "Already claimed");
        require(block.timestamp >= lastClaimTime[msg.sender] + COOLDOWN_PERIOD, "Cooldown not finished");
        
        hasClaimed[msg.sender] = true;
        lastClaimTime[msg.sender] = block.timestamp;
        
        (bool success, ) = payable(msg.sender).call{value: CLAIM_AMOUNT}("");
        require(success, "Transfer failed");
        
        emit TokensClaimed(msg.sender, CLAIM_AMOUNT);
    }

    // Admin functions
    function fundFaucet() external payable onlyOwner {
        // Contract can receive ETH for funding
    }
    
    function withdrawFunds() external onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "No funds to withdraw");
        
        (bool success, ) = payable(owner()).call{value: balance}("");
        require(success, "Withdrawal failed");
    }
    
    function resetUserClaim(address user) external onlyOwner {
        hasClaimed[user] = false;
        lastClaimTime[user] = 0;
    }
    
    function getClaimInfo(address user) external view returns (
        bool claimed,
        uint256 lastClaim,
        uint256 nextClaimTime
    ) {
        return (
            hasClaimed[user],
            lastClaimTime[user],
            lastClaimTime[user] + COOLDOWN_PERIOD
        );
    }
    
    // Emergency pause
    bool public paused;
    
    modifier whenNotPaused() {
        require(!paused, "Faucet is paused");
        _;
    }
    
    function setPaused(bool _paused) external onlyOwner {
        paused = _paused;
    }
    
    // Override claim function to include pause check
    function claim() external whenNotPaused nonReentrant {
        require(!hasClaimed[msg.sender], "Already claimed");
        require(block.timestamp >= lastClaimTime[msg.sender] + COOLDOWN_PERIOD, "Cooldown not finished");
        
        hasClaimed[msg.sender] = true;
        lastClaimTime[msg.sender] = block.timestamp;
        
        (bool success, ) = payable(msg.sender).call{value: CLAIM_AMOUNT}("");
        require(success, "Transfer failed");
        
        emit TokensClaimed(msg.sender, CLAIM_AMOUNT);
    }
} 