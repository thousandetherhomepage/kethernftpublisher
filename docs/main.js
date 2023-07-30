import {
    EthereumClient,
    w3mConnectors,
    w3mProvider,
    WagmiCore,
    WagmiCoreChains,
    WagmiCoreConnectors,
} from "https://unpkg.com/@web3modal/ethereum@2.6.1";

import { Web3Modal } from "https://unpkg.com/@web3modal/html@2.6.1";

const { mainnet, sepolia } = WagmiCoreChains;
const { configureChains, createConfig, watchAccount, getContract, getWalletClient } = WagmiCore;

const config = {
    walletConnectProjectID: "c2b10083c2b1bda11734bd4f48101899",

    deployed: {
        [mainnet.id]: {
            ketherNFTPublisherAddress: "0xda5aba302810ab3f6a3f3e7f8ab0307c1f464bc9",
        },
        [sepolia.id]: {
            ketherNFTPublisherAddress: "0xcba5846735a03ac02af69134Df1aB17f122DD2dD",
        }
    },
    abi: [
        'function approve(address to, uint256 tokenId)',
        'function getApproved(uint256 tokenId) view returns (address)',
        'function isApprovedForAll(address owner, address operator) view returns (bool)',
        'function isApprovedToPublish(address publisher, uint256 tokenId) view returns (bool)',
        'function ketherNFT() view returns (address)',
        'function ketherSortition() view returns (address)',
        'function publish(uint256 _idx, string _link, string _image, string _title, bool _NSFW)',
        'function publishFeeAmount() view returns (uint256)',
        'function publishFeeToken() view returns (address)',
        'function publishTimeout() view returns (uint256)',
        'function setApprovalForAll(address operator, bool approved)',
    ]
}

const chains = [mainnet, sepolia];
const projectId = config.walletConnectProjectID;

const { publicClient } = configureChains(chains, [w3mProvider({ projectId })]);
const wagmiConfig = createConfig({
    autoConnect: true,
    connectors: [
        ...w3mConnectors({ chains, version: 2, projectId }),
        new WagmiCoreConnectors.CoinbaseWalletConnector({
            chains,
            options: {
                appName: "ThousandEtherHomepage Publish Delegate",
            },
        }),
    ],
    publicClient,
});

const ethereumClient = new EthereumClient(wagmiConfig, chains);
export const web3modal = new Web3Modal(
    {
        projectId,
    },
    ethereumClient
);

async function onConnect({address}) {
    console.debug("Connected", address);

    const walletClient = await getWalletClient();
    const chainId = await walletClient.getChainId();

    const deploy = config.deployed[chainId];
    if (deploy === undefined) {
        throw "Unsupported chain: " + chainId;
    }

    console.debug("Loaded chain config", deploy);

    const contract = await getContract({
        address: deploy.ketherNFTPublisherAddress,
        abi: config.abi,
        walletClient,
    })
    console.debug("XXX", contract);
}

watchAccount(async function(state) {
    if (state.isConnected) {
        await onConnect(state);
    }
});
