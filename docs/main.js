import {
  EthereumClient,
  w3mConnectors,
  w3mProvider,
  WagmiCore,
  WagmiCoreChains,
  WagmiCoreConnectors,
} from "https://unpkg.com/@web3modal/ethereum@2.6.1";

import { Web3Modal } from "https://unpkg.com/@web3modal/html@2.6.1";

const { mainnet } = WagmiCoreChains;
const { configureChains, createConfig, getAccount, getContract  } = WagmiCore;

const chains = [mainnet];
const projectId = "c2b10083c2b1bda11734bd4f48101899";

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

web3modal.subscribeModal(newState => console.log(newState));
