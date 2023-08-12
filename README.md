# KetherNFTPublisher


KetherNFTPublisher allows an owner of a KetherNFT to delegate
publishing permission to another address. Only one address can be approved
at a time.

Approving the KetherSortition address will give the acting magistrate
permission to publish.

## Example

1. Owner of KetherNFT sets KetherNFTPublisher instance as approved spender:
   `KetherNFT.approve(address(KetherNFTPublisher), tokenId);`
2. Owner of KetherNFT sets approvals on KetherNFTPublisher instance for approved publisher:
   `KetherNFTPublisher.approve(msg.sender, tokenId);`
3. Approved publisher can use:
   `KetherNFTPublisher.publish(tokenId, ...);`
4. Owner can clear approval:
   `KetherNFTPublisher.approve(address(0), tokenId);`
5. Owner can approve the magistrate:
   `KetherNFTPublisher.approve(address(KetherSortition), tokenId);`


## Deployed

- Mainnet: [0x45C5508bA714bd27404c16f594967e998Afc6B60](https://etherscan.io/address/0x45C5508bA714bd27404c16f594967e998Afc6B60)
- Sepolia: [0x32EF068FbC48A6eC0e4648E52370FFac02287c3e](https://sepolia.etherscan.io/address/0x32EF068FbC48A6eC0e4648E52370FFac02287c3e)

## License

MIT
