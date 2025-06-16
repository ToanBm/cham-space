import { BrowserProvider } from "ethers";

// Không kiểm tra flag nữa — dùng thẳng window.ethereum
function getEthereum() {
  return window.ethereum || null;
}

export async function connectWallet(walletKey = "metamask") {
  const eth = getEthereum();

  if (!eth) {
    alert("❌ No Ethereum provider found");
    return null;
  }

  try {
    console.log(`🔌 Connecting to wallet: ${walletKey}`);
    const accounts = await eth.request({ method: "eth_requestAccounts" });
    if (!accounts || accounts.length === 0) throw new Error("No accounts returned");

    const provider = new BrowserProvider(eth);
    const signer = await provider.getSigner();
    const network = await provider.getNetwork();

    return {
      provider,
      signer,
      address: await signer.getAddress(),
      chainId: Number(network.chainId),
    };
  } catch (err) {
    console.error("connectWallet error:", err);
    alert("❌ Connection failed");
    return null;
  }
}

export async function getExistingWallet() {
  const eth = getEthereum();
  if (!eth) return null;

  const accounts = await eth.request({ method: "eth_accounts" });
  if (accounts.length === 0) return null;

  const provider = new BrowserProvider(eth);
  const signer = await provider.getSigner();
  const network = await provider.getNetwork();

  return {
    provider,
    signer,
    address: await signer.getAddress(),
    chainId: Number(network.chainId),
  };
}

export function disconnectWallet() {
  console.log("🔌 Disconnected");
}

export async function switchNetwork(chainInfo) {
  const eth = getEthereum();
  if (!eth) return;

  try {
    await eth.request({
      method: "wallet_addEthereumChain",
      params: [{
        chainId: "0x" + chainInfo.chainId.toString(16),
        chainName: chainInfo.chainName,
        nativeCurrency: chainInfo.nativeCurrency,
        rpcUrls: chainInfo.rpcUrls,
        blockExplorerUrls: chainInfo.blockExplorerUrls,
      }],
    });
  } catch (err) {
    console.error("switchNetwork error:", err);
    alert("❌ Failed to switch network");
  }
}
