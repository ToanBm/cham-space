import { BrowserProvider } from "ethers";

// ✅ Kết nối ví, chỉ yêu cầu nếu chưa có tài khoản kết nối
export async function connectWallet() {
  if (!window.ethereum) {
    alert("Please install MetaMask or OKX Wallet!");
    return null;
  }

  try {
    // Kiểm tra nếu đã từng kết nối, không gọi eth_requestAccounts nữa
    const accounts = await window.ethereum.request({ method: "eth_accounts" });
    if (accounts.length === 0) {
      // Chỉ gọi yêu cầu nếu chưa có kết nối
      await window.ethereum.request({ method: "eth_requestAccounts" });
    }

    const provider = new BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    const network = await provider.getNetwork();

    return {
      provider,
      signer,
      address: await signer.getAddress(),
      chainId: Number(network.chainId),
    };
  } catch (error) {
    console.error("connectWallet error:", error);
    alert("❌ Wallet connection failed. Please unlock your wallet and try again.");
    return null;
  }
}

// ✅ Lấy lại ví đã kết nối (không hiện popup)
export async function getExistingWallet() {
  if (!window.ethereum) return null;

  const accounts = await window.ethereum.request({ method: "eth_accounts" });
  if (accounts.length === 0) return null;

  const provider = new BrowserProvider(window.ethereum);
  const signer = await provider.getSigner();
  const network = await provider.getNetwork();

  return {
    provider,
    signer,
    address: await signer.getAddress(),
    chainId: Number(network.chainId),
  };
}

// ✅ Chuyển network nếu chưa đúng (ví dụ từ Ethereum sang Monad testnet)
export async function switchNetwork(chainInfo) {
  try {
    await window.ethereum.request({
      method: "wallet_addEthereumChain",
      params: [{
        chainId: "0x" + chainInfo.chainId.toString(16),
        chainName: chainInfo.chainName,
        nativeCurrency: chainInfo.nativeCurrency,
        rpcUrls: chainInfo.rpcUrls,
        blockExplorerUrls: chainInfo.blockExplorerUrls,
      }],
    });
  } catch (error) {
    console.error("switchNetwork error:", error);
    alert("Failed to switch network!");
  }
}

// ❌ Không cần ngắt ví thật, chỉ xoá local info
export function disconnectWallet() {
  console.log("🔌 Disconnected frontend only");
}
