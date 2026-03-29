// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import '@fhenixprotocol/cofhe-contracts/FHE.sol';

/// @title GhostVault — programmable private wallet (FHE balances, transfers, rules)
contract GhostVault {
    mapping(address => euint64) private _balances;
    mapping(address => euint64) private _ruleThreshold;
    mapping(address => ebool) private _lastRuleAbove;

    /// @notice Add encrypted funds to the caller's balance (private deposit).
    function deposit(InEuint64 calldata encryptedAmount) external {
        euint64 amount = FHE.asEuint64(encryptedAmount);
        _balances[msg.sender] = FHE.add(_balances[msg.sender], amount);
        _allowBalance(msg.sender, _balances[msg.sender]);
    }

    /// @notice Move encrypted amount from caller to `to` without revealing the amount on-chain.
    function transferPrivate(address to, InEuint64 calldata encryptedAmount) external {
        require(to != address(0), 'GhostVault: zero address');
        require(to != msg.sender, 'GhostVault: self transfer');
        euint64 amount = FHE.asEuint64(encryptedAmount);
        euint64 newSender = FHE.sub(_balances[msg.sender], amount);
        euint64 newReceiver = FHE.add(_balances[to], amount);
        _balances[msg.sender] = newSender;
        _balances[to] = newReceiver;
        _allowBalance(msg.sender, newSender);
        _allowBalance(to, newReceiver);
    }

    /// @notice Encrypted balance handle for the caller (decrypt off-chain with permit).
    function getBalance() external view returns (euint64) {
        return _balances[msg.sender];
    }

    /// @notice Store an encrypted threshold for the "rule" (balance above threshold).
    function setRuleThreshold(InEuint64 calldata encryptedThreshold) external {
        euint64 t = FHE.asEuint64(encryptedThreshold);
        _ruleThreshold[msg.sender] = t;
        FHE.allowThis(t);
        FHE.allowSender(t);
    }

    function getRuleThreshold() external view returns (euint64) {
        return _ruleThreshold[msg.sender];
    }

    /// @notice Computes balance > threshold on-chain (must be a tx so ACL updates persist).
    function refreshRuleCheck() external returns (ebool) {
        ebool result = FHE.gt(_balances[msg.sender], _ruleThreshold[msg.sender]);
        FHE.allowThis(result);
        FHE.allowSender(result);
        FHE.allow(result, msg.sender);
        _lastRuleAbove[msg.sender] = result;
        return result;
    }

    /// @notice Latest encrypted rule outcome for the caller (decrypt off-chain after `refreshRuleCheck`).
    function getLastRuleAbove() external view returns (ebool) {
        return _lastRuleAbove[msg.sender];
    }

    /// @notice Encrypted swap/trade intent per user (amount hidden) — demo for private execution.
    mapping(address => euint64) private _tradeIntents;

    function setTradeIntent(InEuint64 calldata encryptedAmount) external {
        euint64 amount = FHE.asEuint64(encryptedAmount);
        _tradeIntents[msg.sender] = amount;
        euint64 stored = _tradeIntents[msg.sender];
        FHE.allowThis(stored);
        FHE.allowSender(stored);
        FHE.allow(stored, msg.sender);
    }

    function getTradeIntent() external view returns (euint64) {
        return _tradeIntents[msg.sender];
    }

    /// @notice Publish a decrypt result verified by the Threshold Network (optional on-chain proof).
    function publishBalance(
        euint64 ctHash,
        uint64 plaintext,
        bytes calldata signature
    ) external {
        FHE.publishDecryptResult(ctHash, plaintext, signature);
    }

    /// @notice Let an auditor (or employer) use ACL to decrypt your balance handle later via permit.
    function grantBalanceViewer(address viewer) external {
        euint64 b = _balances[msg.sender];
        FHE.allow(b, viewer);
    }

    function _allowBalance(address owner, euint64 bal) private {
        FHE.allowThis(bal);
        FHE.allowSender(bal);
        FHE.allow(bal, owner);
    }
}
