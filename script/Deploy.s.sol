//SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";

import "../src/KetherNFTPublisher.sol";

contract Deploy is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("ETH_PRIVATE_KEY");

        address ketherNFTContract = vm.envAddress("KETHER_NFT_CONTRACT");
        address ketherSortitionContract = vm.envAddress("KETHER_SORTITION_CONTRACT");

        vm.startBroadcast(deployerPrivateKey);

        KetherNFTPublisher ketherPublisherContract = new KetherNFTPublisher(ketherNFTContract, ketherSortitionContract);

        vm.stopBroadcast();
    }
}
