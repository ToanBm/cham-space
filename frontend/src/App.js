import { useState } from "react";
import MintPanel from "./components/MintPanel";
import UserPanel from "./components/UserPanel";
import UserPopup from "./components/UserPopup";
import WalletPanel from "./components/WalletPanel";
import { marketNftAbi } from "./abi/marketNftAbi";
import { ethers, Contract, BrowserProvider } from "ethers";
import { ensureCorrectNetwork } from "./utils/connectWallet";
import "./App.css";

function App() {
  const [signer, setSigner] = useState(null);
  const [selectedNFT, setSelectedNFT] = useState(null);

  async function handleList(info) {
    try {
      // Step 1: Ensure correct network before listing
      await ensureCorrectNetwork(info.chain);
      
      // Step 2: Proceed with listing
      const provider = new BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new Contract(info.contract, marketNftAbi, signer);

      const tx = await contract.listForSale(
        info.tokenId,
        ethers.parseEther(info.price)
      );
      await tx.wait();

      alert(`✅ NFT ${info.name} listed at ${info.price}`);
    } catch (err) {
      console.error("❌ List failed:", err);
      
      // Show specific error message for network issues
      if (err.message.includes("network")) {
        alert("⚠️ " + err.message);
      } else {
        alert("❌ List failed: " + (err?.info?.error?.message || err.message));
      }
    }
  }

  return (
    <div className="container">
      <div className="left-panel">
        <MintPanel signer={signer} />
      </div>

      <div className="right-panel">
        <WalletPanel onWalletConnected={({ signer }) => setSigner(signer)} />

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
