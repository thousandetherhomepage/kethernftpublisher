// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";

import { KetherNFTPublisher, IKetherNFTPublish, IKetherSortition, Errors } from "../src/KetherNFTPublisher.sol";

import { KetherNFT } from "ketherhomepage/KetherNFT.sol";
import { KetherHomepageV2 } from "ketherhomepage/KetherHomepageV2.sol";
import { IKetherHomepage } from "ketherhomepage/IKetherHomepage.sol";

// MockSortition where anyone can change the magistrate, for testing.
contract MockSortition is IKetherSortition {
    address public _magistrate;

    function setMagistrate(address m) external {
        _magistrate = m;
    }

    function getMagistrate() external view returns (address) {
        return _magistrate;
    }
}

contract KetherNFTPublisherTest is Test {
    KetherNFT public nft;
    MockSortition public sortition;
    IKetherHomepage public homepage;
    KetherNFTPublisher public publisher;

    address sender;

    uint256 constant pixelPrice = 100 * 1000000000000000;

    function setUp() public {
        homepage = new KetherHomepageV2(msg.sender, payable(msg.sender));
        nft = new KetherNFT(address(homepage), address(0x0));
        sortition = new MockSortition();
        publisher = new KetherNFTPublisher(address(nft), address(sortition));

        // Pretend to be an EOA so that safeMint passes
        sender = vm.addr({privateKey: 1});
        vm.deal(sender, 1 << 128);
        vm.startPrank(sender, sender);

        nft.buy{value: 100 * pixelPrice}(0, 0, 10, 10);
        nft.buy{value: 25 * pixelPrice}(20, 20, 5, 5);

    }

    function _getLink(uint256 idx) internal view returns (string memory) {
        (,,,,,string memory link,,,,) = homepage.ads(idx);
        return link;
    }

    function test_CheckOwnerApproved() public {
        uint idx = 0;
        assertEq(nft.ownerOf(idx), sender);

        vm.expectRevert(bytes(Errors.MustApprovePublisher));
        assertFalse(publisher.isApprovedToPublish(sender, idx), "owner should not be approved until publish contract is");

        nft.setApprovalForAll(address(publisher), true);
        assertTrue(publisher.isApprovedToPublish(sender, idx), "owner should be approved after publish contract is");
    }

    function test_CheckMagistrateApproval() public {
        uint256 idx = 0;
        address magistrate = address(0xabcd);

        nft.setApprovalForAll(address(publisher), true);
        publisher.setApprovalForAll(address(sortition), true);
        sortition.setMagistrate(magistrate);

        assertTrue(publisher.isApprovedToPublish(magistrate, idx));
    }

    function test_PublishAsApproved() public {
        uint256 idx = 0;
        nft.publish(idx, "hi", "", "", false);
        assertEq(_getLink(idx), "hi");

        vm.expectRevert(bytes(Errors.MustApprovePublisher));
        publisher.publish(idx, "foo", "", "", false);

        // Approved for just idx=0
        nft.approve(address(publisher), idx);
        publisher.publish(idx, "foo", "", "", false);
        assertEq(_getLink(idx), "foo");

        // Not approved for other tokens
        idx = 1;
        vm.expectRevert(bytes(Errors.MustApprovePublisher));
        publisher.publish(idx, "bar", "", "", false);

        // Remove approval
        nft.approve(address(0x0), idx);
        vm.expectRevert(bytes(Errors.MustApprovePublisher));
        publisher.publish(idx, "bar", "", "", false);
    }

    function test_PublishAsApprovedForAll() public {
        uint256 idx = 0;
        nft.publish(idx, "hi", "", "", false);
        assertEq(_getLink(idx), "hi");

        // Approved for all tokens
        nft.setApprovalForAll(address(publisher), true);
        publisher.publish(idx, "foo", "", "", false);
        assertEq(_getLink(idx), "foo");

        idx = 1;
        publisher.publish(idx, "bar", "", "", false);
        assertEq(_getLink(idx), "bar");

        // Remove approval
        nft.setApprovalForAll(address(publisher), false);

        vm.expectRevert(bytes(Errors.MustApprovePublisher));
        publisher.publish(idx, "bar", "", "", false);
    }

    function test_PublishAsMagistrate() public {
        address magistrate = address(0xabcd);

        // Allow publisher to manage our NFTs
        vm.prank(sender);
        nft.setApprovalForAll(address(publisher), true);

        uint256 idx = 0;

        assertFalse(
                publisher.isApprovedToPublish(magistrate, idx),
                "magistrate should fail idx=0");

        assertTrue(
                publisher.isApprovedToPublish(sender, idx),
                "sender should be approved");

        assertEq(sortition.getMagistrate(), address(0x0), "magistrate should start unset");
        assertFalse(
                publisher.isApprovedToPublish(magistrate, idx),
                "magistrate should fail until sortition is approved");

        vm.expectRevert(bytes(Errors.SenderNotApproved));
        vm.prank(magistrate);
        publisher.publish(idx, "foo", "", "", false);

        // Approve magistrate, but caller is not magistrate yet
        vm.prank(sender);
        publisher.setApprovalForAll(address(sortition), true);

        assertTrue(publisher.isApprovedToPublish(sortition.getMagistrate(), idx), "actual magistrate should pass");
        assertFalse(publisher.isApprovedToPublish(magistrate, idx), "future magistrate should fail");

        vm.expectRevert(bytes(Errors.SenderNotApproved));
        vm.prank(magistrate);
        publisher.publish(idx, "foo", "", "", false);


        // Update magistrate, should pass now
        sortition.setMagistrate(magistrate);
        assertTrue(publisher.isApprovedToPublish(magistrate, idx));

        vm.prank(magistrate);
        publisher.publish(idx, "foo", "", "", false);
        assertEq(_getLink(idx), "foo");

        sortition.setMagistrate(address(0x0));
        vm.expectRevert(bytes(Errors.SenderNotApproved));
        vm.prank(magistrate);
        publisher.publish(idx, "foo", "", "", false);

        assertTrue(publisher.isApprovedToPublish(sortition.getMagistrate(), idx));
        assertFalse(publisher.isApprovedToPublish(magistrate, idx));
    }


}
