// edited from https://twitter.com/auditone_team/status/1644291748112285697

// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "./interfaces/IVulnerable.sol";

contract NotReentrancyVulnerable is IVulnerable {
  mapping(address => uint256) public balances;

  constructor() payable {}

  function deposit() public payable {
    balances[msg.sender] += msg.value;
  }

  function withdraw(uint256 amount) public {
    require(balances[msg.sender] >= amount);
    (bool success,) = payable(msg.sender).call{value: amount}("");
    require(success, "transfer failed");
    balances[msg.sender] -= amount;
  }
}