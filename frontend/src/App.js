import { useEffect, useState } from "react";
import {
  connectWallet,
  getExistingWallet,
  disconnectWallet,
  switchNetwork,
} from "./utils/connectWallet";
import { CHAINS } from "./utils/chains";
import MintPanel from "./components/MintPanel";
import UserPanel from "./components/UserPanel";
import UserPopup from "./components/UserPopup";
import CustomNetworkSelector from "./components/CustomNetworkSelector";
import { marketNftAbi } from "./abi/marketNftAbi";
import { ethers, Contract, BrowserProvider } from "ethers";
import "./App.css";

let lastFetchTime = 0;

function App() {
  const [signer, setSigner] = useState(null);
  const [walletAddress, setWalletAddress] = useState("");
  const [selectedChain, setSelectedChain] = useState(() => localStorage.getItem("selectedChain") || "MONAD");
  const [balance, setBalance] = useState(null);
  const [selectedNFT, setSelectedNFT] = useState(null);

  useEffect(() => {
    async function reconnect() {
      const wallet = await getExistingWallet();
      if (wallet?.signer) {
        const address = await wallet.signer.getAddress();
        setSigner(wallet.signer);
        setWalletAddress(address);

        const chainProvider = new ethers.JsonRpcProvider(
          CHAINS[selectedChain].rpcUrls[0]
        );
        await loadBalance(chainProvider, address);
      }
    }

    reconnect();

    window.ethereum?.on("accountsChanged", (accounts) => {
      if (accounts.length === 0) disconnect();
      else connect();
    });

    return () => {
      window.ethereum?.removeAllListeners("accountsChanged");
    };
  }, [selectedChain]);

  async function connect() {
    const wallet = await connectWallet();
    if (wallet) {
      const address = await wallet.signer.getAddress();
      setSigner(wallet.signer);
      setWalletAddress(address);

      const provider = new ethers.JsonRpcProvider(
        CHAINS[selectedChain].rpcUrls[0]
      );
      await loadBalance(provider, address);
    }
  }

  function disconnect() {
    disconnectWallet();
    setSigner(null);
    setWalletAddress("");
  }

  async function handleSwitchNetwork(chainKey) {
    if (chainKey === "DISCONNECT") {
      disconnect();
      return;
    }
    const chainInfo = CHAINS[chainKey];
    await switchNetwork(chainInfo);
    localStorage.setItem("selectedChain", chainKey);
    setSelectedChain(chainKey);
  }

  function getNativeTokenSymbol() {
    return CHAINS[selectedChain]?.nativeCurrency?.symbol || "ETH";
  }

  async function loadBalance(provider, address) {
    const now = Date.now();
    if (now - lastFetchTime < 1000) return;
    lastFetchTime = now;

    try {
      const raw = await provider.getBalance(address);
      const formatted = parseFloat(ethers.formatEther(raw)).toFixed(2);
      setBalance(formatted);
    } catch (err) {
      console.error("\u274C Failed to fetch balance:", err);
    }
  }

  async function handleList(info) {
    try {
      const provider = new BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new Contract(info.contract, marketNftAbi, signer);

      const tx = await contract.listForSale(
        info.tokenId,
        ethers.parseEther(info.price)
      );
      await tx.wait();

      alert(`\u2705 NFT ${info.name} listed at ${info.price}`);
    } catch (err) {
      console.error("\u274C List failed:", err);
      alert("\u274C List failed: " + (err?.info?.error?.message || err.message));
    }
  }

  return (
    <div className="container">
      <div className="left-panel">
        <MintPanel signer={signer} />
      </div>

      <div className="right-panel">
        <div className="network-panel">
          <div className="network-row">
            {!signer ? (
              <button className="wallet-button" onClick={connect}>
                Connect Wallet
              </button>
            ) : (
              <div
                className="wallet-button"
              >
                {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
              </div>
            )}

            <CustomNetworkSelector
              selectedChain={selectedChain}
              onSwitch={handleSwitchNetwork}
            />
          </div>

          <div className="balance-box">
            Balance: {balance ?? "—"} {getNativeTokenSymbol()}
          </div>
          <button className="faucet-button">Faucet</button>
        </div>

        {signer && <UserPanel signer={signer} onSelect={setSelectedNFT} />}

        <div className="footer-panel">
          <div className="footer-text">
            <div className="line-app">
              A Multi Chain NFT Launch & Trade Hub
            </div>
            <div className="line-version">© 2025 ToanBm - Version 1.0</div>
          </div>

          <div className="social-icons">
            <a
              href="https://github.com/ToanBm"
              target="_blank"
              rel="noreferrer"
              className="social-button"
            >
              <img src="/icon/github.svg" alt="" />
            </a>
            <a
              href="https://x.com/buiminhtoan1985"
              target="_blank"
              rel="noreferrer"
              className="social-button"
            >
              <img src="/icon/x.svg" alt="" />
            </a>
            <a
              href="https://discord.com/users/toanbm"
              target="_blank"
              rel="noreferrer"
              className="social-button"
            >
              <img src="/icon/discord.svg" alt="" />
            </a>
            <a
              href="https://t.me/"
              target="_blank"
              rel="noreferrer"
              className="social-button"
            >
              <img src="/icon/telegram.svg" alt="" />
            </a>
          </div>
        </div>
      </div>

      <UserPopup
        selectedNFT={selectedNFT}
        onClose={() => setSelectedNFT(null)}
        onList={handleList}
      />
    </div>
  );
}

export default App;