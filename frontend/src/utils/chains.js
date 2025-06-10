export const CHAINS = {
  MONAD: {
    chainId: 10143,
    chainName: "Monad Testnet",
    rpcUrls: ["https://monad-testnet.g.alchemy.com/v2/nydNBvxduej2ywCKpfFbV9J9bR2z38c4"],
    nativeCurrency: { name: "Monad", symbol: "MON", decimals: 18 },
    blockExplorerUrls: ["https://testnet.monadexplorer.com/"],
    networkIcon: "/icon/monad.png"
  },
  SOMNIA: {
    chainId: 50312,
    chainName: "Somnia Testnet",
    rpcUrls: ["https://dream-rpc.somnia.network"],
    nativeCurrency: { name: "Somnia", symbol: "STT", decimals: 18 },
    blockExplorerUrls: ["https://shannon-explorer.somnia.network/"],
    networkIcon: "/icon/somnia.png"
  },
  PHAROS: {
    chainId: 688688,
    chainName: "Pharos Testnet",
    rpcUrls: ["https://testnet.dplabs-internal.com"],
    nativeCurrency: { name: "Pharos", symbol: "PHRS", decimals: 18 },
    blockExplorerUrls: ["https://testnet.pharosscan.xyz"],
    networkIcon: "/icon/pharos.png"
  },
  OG: {
    chainId: 16601,
    chainName: "0G Galileo Testnet",
    rpcUrls: ["https://evmrpc-testnet.0g.ai"],
    nativeCurrency: { name: "0G Token", symbol: "OG", decimals: 18 },
    blockExplorerUrls: ["https://chainscan-galileo.0g.ai/"],
    networkIcon: "/icon/og.png"
  },
  MEGA: {
    chainId: 6342,
    chainName: "MEGA Testnet",
    rpcUrls: ["https://carrot.megaeth.com/rpc"],
    nativeCurrency: { name: "MEGA Testnet Ether", symbol: "ETH", decimals: 18 },
    blockExplorerUrls: ["https://uptime.megaeth.com", "https://megaexplorer.xyz"],
    networkIcon: "/icon/megaeth.png"
  }
};
