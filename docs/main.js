import {
    EthereumClient,
    w3mConnectors,
    w3mProvider,
    WagmiCore,
    WagmiCoreChains,
    WagmiCoreConnectors,
} from "https://unpkg.com/@web3modal/ethereum@2.6.1";

import { Web3Modal } from "https://unpkg.com/@web3modal/html@2.6.1";

import "./components.js";

const { mainnet, sepolia } = WagmiCoreChains;
const { configureChains, createConfig, writeContract, waitForTransaction, watchNetwork, getWalletClient, multicall} = WagmiCore;

const config = {
    walletConnectProjectID: "c2b10083c2b1bda11734bd4f48101899",

    deployed: {
        [mainnet.id]: {
            ketherNFTPublisherAddress: "0xDa5aba302810ab3F6A3f3E7f8aB0307c1f464Bc9",
        },
        [sepolia.id]: {
            ketherNFTPublisherAddress: "0xcba5846735a03ac02af69134Df1aB17f122DD2dD",
        }
    },
    abi: [
        {"type":"function","name":"approve","constant":false,"payable":false,"inputs":[{"type":"address","name":"to"},{"type":"uint256","name":"tokenId"}],"outputs":[]},
        {"type":"function","name":"getApproved","constant":true,"stateMutability":"view","payable":false,"inputs":[{"type":"uint256","name":"tokenId"}],"outputs":[{"type":"address"}]},
        {"type":"function","name":"isApprovedForAll","constant":true,"stateMutability":"view","payable":false,"inputs":[{"type":"address","name":"owner"},{"type":"address","name":"operator"}],"outputs":[{"type":"bool"}]},
        {"type":"function","name":"isApprovedToPublish","constant":true,"stateMutability":"view","payable":false,"inputs":[{"type":"address","name":"publisher"},{"type":"uint256","name":"tokenId"}],"outputs":[{"type":"bool"}]},
        {"type":"function","name":"ketherNFT","constant":true,"stateMutability":"view","payable":false,"inputs":[],"outputs":[{"type":"address"}]},
        {"type":"function","name":"ketherSortition","constant":true,"stateMutability":"view","payable":false,"inputs":[],"outputs":[{"type":"address"}]},
        {"type":"function","name":"publish","constant":false,"payable":false,"inputs":[{"type":"uint256","name":"_idx"},{"type":"string","name":"_link"},{"type":"string","name":"_image"},{"type":"string","name":"_title"},{"type":"bool","name":"_NSFW"}],"outputs":[]},
        {"type":"function","name":"publishFeeAmount","constant":true,"stateMutability":"view","payable":false,"inputs":[],"outputs":[{"type":"uint256"}]},
        {"type":"function","name":"publishFeeToken","constant":true,"stateMutability":"view","payable":false,"inputs":[],"outputs":[{"type":"address"}]},
        {"type":"function","name":"publishTimeout","constant":true,"stateMutability":"view","payable":false,"inputs":[],"outputs":[{"type":"uint256"}]},
        {"type":"function","name":"setApprovalForAll","constant":false,"payable":false,"inputs":[{"type":"address","name":"operator"},{"type":"bool","name":"approved"}],"outputs":[]},
    ],
}

const abiBalanceOf = [{"inputs":[{"internalType":"address","name":"owner","type":"address"}],"name":"balanceOf","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"}];

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
                appName: "ThousandEtherHomepage Publisher Delegate",
            },
        }),
    ],
    publicClient,
});

const ethereumClient = new EthereumClient(wagmiConfig, chains);
export const web3modal = new Web3Modal({ projectId }, ethereumClient);

async function onConnect() {
    const walletClient = await getWalletClient();
    const [address] = await walletClient.getAddresses();
    const chainId = await walletClient.getChainId();
    console.log("Connected", {address, chainId});

    const deploy = config.deployed[chainId];
    if (deploy === undefined) {
        throw "Unsupported chain: " + chainId;
    }

    console.log("Loaded chain config", deploy);

    const contract = {
        address: deploy.ketherNFTPublisherAddress,
        abi: config.abi,
        chainId,
        walletClient,
    };

    const [
        ketherNFT,
        ketherSortition,
        publishTimeout,
        publishFeeToken,
        publishFeeAmount,
    ] = (await multicall({
        contracts: [
            { ...contract, functionName: 'ketherNFT', },
            { ...contract, functionName: 'ketherSortition', },
            { ...contract, functionName: 'publishTimeout', },
            { ...contract, functionName: 'publishFeeToken', },
            { ...contract, functionName: 'publishFeeAmount', },
        ],
    })).map(r => r.result);

    const settings = {
        chainId,
        ketherNFT,
        ketherSortition,
        publishTimeout,
        publishFeeToken,
        publishFeeAmount,
        ketherNFTPublisher: deploy.ketherNFTPublisherAddress,
        sender: address,
    };

    const ketherNFTabi = config.abi; // Technically wrong abi but this function overlaps

    [
        settings.isPublisherApproved,
        settings.senderBalance,
        settings.isSortitionApproved
    ] = (await multicall({
        contracts: [
            { address: settings.ketherNFT, abi: ketherNFTabi, functionName: 'isApprovedForAll', args: [address, ketherSortition]},
            { address: settings.ketherNFT, abi: abiBalanceOf , functionName: 'balanceOf', args: [address] },
            { ...contract, functionName: 'isApprovedForAll', args: [address, settings.ketherSortition]},
        ]
    })).map(r => r.result);

    console.log("Loaded contract settings:", settings);

    const methods = {
        async approvePublisher() {
            return await writeContract({
                address: settings.ketherNFT,
                abi: config.abi, // Technically wrong abi but this function overlaps
                functionName: 'setApprovalForAll',
                args: [ketherSortition, true],
            })
        },
        async approve(to, tokenId) {
            return await writeContract({
                address: settings.ketherNFTPublisher,
                abi: config.abi,
                functionName: 'approve',
                args: [to, tokenId],
            })
        },
        async setApprovalForAll(to, value) {
            return await writeContract({
                address: settings.ketherNFTPublisher,
                abi: config.abi,
                functionName: 'setApprovalForAll',
                args: [to, value],
            })
        }
    }

    const component = document.querySelector('publisher-contract');
    component.methods = methods;
    component.update(settings);

    component.addEventListener('update', (event) => {
        waitForTransaction({
            hash: event.detail.hash
        }).then((r) => {
            console.log("Transaction included, reloading:", r);
            component.element.querySelector('publisher-messages').append(['Transaction included: ' + r.status]);
        }).then(onConnect);
    });
}

watchNetwork(onConnect);
