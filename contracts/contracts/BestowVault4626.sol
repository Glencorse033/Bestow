// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts-upgradeable/token/ERC20/extensions/ERC4626Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/PausableUpgradeable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuardTransient.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 * @title BestowVault4626
 * @notice ERC-4626 Tokenized Vault for Bestow Protocol on Arc Network.
 * Supports both standard ERC20 deposits and Native USDC deposits (unified balance).
 */
contract BestowVault4626 is Initializable, ERC4626Upgradeable, AccessControlUpgradeable, PausableUpgradeable, ReentrancyGuardTransient, UUPSUpgradeable {
    using SafeERC20 for IERC20;

    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant MANAGER_ROLE = keccak256("MANAGER_ROLE");

    // Fees are in Basis Points (1 = 0.01%, 100 = 1%)
    uint256 public constant MAX_FEE = 1000; // Max 10%
    uint256 public depositFeeBps;
    uint256 public withdrawalFeeBps;
    address public feeRecipient;

    // Custom events
    event DepositNative(address indexed sender, address indexed owner, uint256 assets, uint256 shares);
    event FeesUpdated(uint256 depositFee, uint256 withdrawalFee);
    event FeeRecipientUpdated(address newRecipient);
    event RewardsDistributed(uint256 amount);
    event EmergencyWithdrawal(address indexed token, uint256 amount);

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    /**
     * @dev Initializer for UUPS Proxy
     * @param _asset The underlying asset (USDC or EURC)
     * @param _name Vault Token Name (e.g. "Bestow USDC Share")
     * @param _symbol Vault Token Symbol (e.g. "bUSDC")
     * @param _admin Address to grant default admin role
     */
    function initialize(
        IERC20 _asset,
        string memory _name,
        string memory _symbol,
        address _admin
    ) public initializer {
        __ERC20_init(_name, _symbol);
        __ERC4626_init(_asset);
        __AccessControl_init();
        __Pausable_init();

        _grantRole(DEFAULT_ADMIN_ROLE, _admin);
        _grantRole(ADMIN_ROLE, _admin);
        _grantRole(MANAGER_ROLE, _admin);
        feeRecipient = _admin;

        // SECURITY FIX: ERC-4626 Inflation Attack — seed dead shares
        _mint(address(1), 10 ** _decimalsOffset());
    }

    function _authorizeUpgrade(address newImplementation) internal override onlyRole(ADMIN_ROLE) {}

    /**
     * @dev SECURITY FIX: ERC-4626 Inflation Attack
     */
    function _decimalsOffset() internal pure override returns (uint8) {
        return 3; 
    }

    /**
     * @notice Deposit Native USDC (Gas Token) into the vault.
     * On Arc/Archway, Native USDC and ERC20 USDC share a unified balance.
     * Sending msg.value automatically increases the underlying asset balance.
     */
    function depositNative(address receiver) external payable nonReentrant whenNotPaused returns (uint256 shares) {
        require(msg.value > 0, "Must send assets");
        // Verify this vault wraps the native equivalent token (Arc USDC)
        // This check assumes the asset set in constructor is the Unified USDC address
        // 0x3600000000000000000000000000000000000000 for Arc Testnet USDC (Native)
        // or the ERC20 interface 0x... that maps to it.
        
        uint256 assetsToDeposit = msg.value;
        
        // Handle Fees
        uint256 fee = (assetsToDeposit * depositFeeBps) / 10000;
        uint256 assetsAfterFee = assetsToDeposit - fee;

        if (fee > 0) {
           // If fee is taken from msg.value, we explicitly send it to feeRecipient
           // Note: msg.value is already in address(this). 
           // We need to transfer the fee OUT to the recipient, otherwise it stays in vault as "yield" for everyone
           (bool success, ) = payable(feeRecipient).call{value: fee}("");
           require(success, "Fee transfer failed");
        }

        // Calculate shares
        // NOTE: totalAssets() includes the msg.value we just received! 
        // We must exclude the current deposit amount from totalAssets when calculating shares to prevent dilution?
        // OpenZeppelin _convertToShares uses totalAssets().
        // If we simply call previewDeposit, it uses current totalAssets.
        // Since msg.value is ALREADY in the balance, totalAssets() is higher than before tx.
        // Correct math: Shares = (AssetsDeposited * TotalSupply) / (TotalAssets - AssetsDeposited)
        // Standard _deposit handles transfer, then mint.
        // Here transfer happened implicitly.
        
        // We calculate shares based on the state BEFORE the deposit contribution.
        // effectively: totalAssets() - msg.value
        uint256 totalAssetsBefore = totalAssets() - assetsToDeposit;
        
        // Custom share calculation to ensure fairness
        if (totalSupply() == 0) {
            shares = assetsAfterFee;
        } else {
            shares = (assetsAfterFee * totalSupply()) / totalAssetsBefore;
        }

        require(shares > 0, "Zero shares");

        _mint(receiver, shares);

        emit DepositNative(msg.sender, receiver, assetsToDeposit, shares);
        emit Deposit(msg.sender, receiver, assetsToDeposit, shares);
        
        return shares;
    }

    /**
     * @notice Standard ERC4626 Deposit with Fee logic
     */
    function deposit(uint256 assets, address receiver) public override whenNotPaused returns (uint256) {
        uint256 maxAssets = maxDeposit(receiver);
        if (assets > maxAssets) {
            revert ERC4626ExceededMaxDeposit(receiver, assets, maxAssets);
        }

        uint256 fee = (assets * depositFeeBps) / 10000;
        uint256 assetsAfterFee = assets - fee;
        
        uint256 shares = previewDeposit(assetsAfterFee);
        
        // Transfer 'assets' from user
        SafeERC20.safeTransferFrom(IERC20(asset()), msg.sender, address(this), assets);
        
        // Send fee to recipient
        if (fee > 0) {
            SafeERC20.safeTransfer(IERC20(asset()), feeRecipient, fee);
        }

        _mint(receiver, shares);

        emit Deposit(msg.sender, receiver, assets, shares);

        return shares;
    }

    /**
     * @notice Standard ERC4626 Mint
     */
    function mint(uint256 shares, address receiver) public override whenNotPaused returns (uint256) {
        uint256 assets = previewMint(shares);
        
        // Add fee on top of required assets? Or deduct from input? 
        // Standard: User wants 'shares', system implementation details:
        // simple implementation: call deposit with calculated assets
        return deposit(assets, receiver); 
        // Note: this might affect exact share output if fees are involved due to rounding.
        // For simplicity in this implementation, we prefer 'deposit' workflow.
    }

    /**
     * @notice Withdraw assets
     */
    function withdraw(uint256 assets, address receiver, address owner) public override whenNotPaused returns (uint256) {
        uint256 maxAssets = maxWithdraw(owner);
        if (assets > maxAssets) {
            revert ERC4626ExceededMaxWithdraw(owner, assets, maxAssets);
        }

        uint256 shares = previewWithdraw(assets);
        
        // Fee Calculation
        uint256 fee = (assets * withdrawalFeeBps) / 10000;
        uint256 assetsToUser = assets - fee;

        if (msg.sender != owner) {
            _spendAllowance(owner, msg.sender, shares);
        }

        _burn(owner, shares);

        // Transfer Asset to User
        SafeERC20.safeTransfer(IERC20(asset()), receiver, assetsToUser);
        
        // Transfer Fee
        if (fee > 0) {
            SafeERC20.safeTransfer(IERC20(asset()), feeRecipient, fee);
        }

        emit Withdraw(msg.sender, receiver, owner, assets, shares);

        return shares;
    }

    // SECURITY FIX: Native Withdrawal Friction
    function withdrawNative(
        uint256 assets,
        address receiver,
        address owner_
    ) external nonReentrant whenNotPaused returns (uint256 shares) {
        uint256 maxAssets = maxWithdraw(owner_);
        if (assets > maxAssets) {
            revert ERC4626ExceededMaxWithdraw(owner_, assets, maxAssets);
        }

        shares = previewWithdraw(assets);
        
        // Fee Calculation
        uint256 fee = (assets * withdrawalFeeBps) / 10000;
        uint256 assetsToUser = assets - fee;

        if (msg.sender != owner_) {
            _spendAllowance(owner_, msg.sender, shares);
        }

        _burn(owner_, shares);

        // Send native token instead of ERC20
        (bool sent, ) = payable(receiver).call{value: assetsToUser}("");
        require(sent, "Native withdrawal failed");
        
        if (fee > 0) {
            (bool feeSent, ) = payable(feeRecipient).call{value: fee}("");
            require(feeSent, "Native fee transfer failed");
        }

        emit Withdraw(msg.sender, receiver, owner_, assets, shares);
    }

    receive() external payable {} // ensure vault can receive native tokens

    /**
     * @notice Distribute Rewards (Admin function to inject yield)
     * Just transferring tokens to this address increases share price for everyone.
     * This function is a helper to log the event and ensure explicit action.
     */
    function distributeRewards(uint256 amount) external nonReentrant onlyRole(MANAGER_ROLE) {
        SafeERC20.safeTransferFrom(IERC20(asset()), msg.sender, address(this), amount);
        emit RewardsDistributed(amount);
    }
    
    /**
     * @notice Distribute Rewards Native (for USDC)
     */
    function distributeRewardsNative() external payable nonReentrant onlyRole(MANAGER_ROLE) {
        require(msg.value > 0, "No value");
        emit RewardsDistributed(msg.value);
    }

    // --- Admin Views & Configuration ---

    function setFees(uint256 _depositFeeBps, uint256 _withdrawalFeeBps) external onlyRole(ADMIN_ROLE) {
        require(_depositFeeBps <= MAX_FEE && _withdrawalFeeBps <= MAX_FEE, "Fee too high");
        depositFeeBps = _depositFeeBps;
        withdrawalFeeBps = _withdrawalFeeBps;
        emit FeesUpdated(_depositFeeBps, _withdrawalFeeBps);
    }

    function setFeeRecipient(address _recipient) external onlyRole(ADMIN_ROLE) {
        require(_recipient != address(0), "Invalid address");
        feeRecipient = _recipient;
        emit FeeRecipientUpdated(_recipient);
    }

    function pause() external onlyRole(ADMIN_ROLE) {
        _pause();
    }

    function unpause() external onlyRole(ADMIN_ROLE) {
        _unpause();
    }

    function emergencyWithdraw(address token, uint256 amount) external onlyRole(ADMIN_ROLE) {
        SafeERC20.safeTransfer(IERC20(token), msg.sender, amount);
        emit EmergencyWithdrawal(token, amount);
    }
}
