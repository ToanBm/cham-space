import { useEffect, useState } from "react";
import { BrowserProvider, Contract, ethers } from "ethers";
import { marketNftAbi } from "../abi/marketNftAbi";
import { ensureCorrectNetwork } from "../utils/connectWallet";
import "../styles/UserPopup.css";
import { CHAINS } from "../utils/chains";

function UserPopup({ selectedNFT, onClose, onList }) {
  const [price, setPrice] = useState("");
  const [tokenSymbol, setTokenSymbol] = useState("");
  const [platformFeePercent] = useState(5); // fixed at 5%
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (selectedNFT?.chain) {
      const symbol = CHAINS[selectedNFT.chain]?.nativeCurrency.symbol;
      if (symbol) {
        setTokenSymbol(symbol);
      }
    }
  }, [selectedNFT]);

  const priceNum = parseFloat(price || "0");
  const feeAmount = (priceNum * platformFeePercent) / 100;
  const receiveAmount = priceNum - feeAmount;

  async function handleSubmit() {
    if (!priceNum || priceNum <= 0) return alert("Please enter valid price!");

    try {
      setLoading(true);
      
      // Step 1: Ensure correct network before listing
      await ensureCorrectNetwork(selectedNFT.chain);
      
      // Step 2: Proceed with listing
      const provider = new BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const user = await signer.getAddress();
      const contract = new Contract(selectedNFT.contract, marketNftAbi, signer);

      const isApproved = await contract.isApprovedForAll(user, selectedNFT.contract);
      if (!isApproved) {
        const approveTx = await contract.setApprovalForAll(selectedNFT.contract, true);
        await approveTx.wait();
      }

      const tx = await contract.listForSale(
        selectedNFT.tokenId,
        ethers.parseEther(price)
      );
      await tx.wait();

      alert(`✅ NFT ${selectedNFT.name} listed at ${price}`);
      onList({ ...selectedNFT, price });
      onClose();
    } catch (err) {
      console.error("❌ List failed:", err);
      
      // Show specific error message for network issues
      if (err.message.includes("network")) {
        alert("⚠️ " + err.message);
      } else {
        alert("❌ List failed: " + (err?.info?.error?.message || err.message));
      }
    } finally {
      setLoading(false);
    }
  }

  if (!selectedNFT) return null;

  return (
    <div className="user-popup-overlay" onClick={onClose}>
      <div className="user-popup-panel" onClick={(e) => e.stopPropagation()}>
        {/* Card 1: Title */}
        <h2 className="user-popup-title">List Item</h2>

        {/* Card 2: Image */}
        <div className="user-popup-image-card">
          <img src={selectedNFT.image} alt={selectedNFT.name} className="user-popup-nft-image" />
        </div>

        {/* Card 3: Price and Fee */}
        <div className="user-popup-input-card">
          <div className="row row-top">
            <div className="user-popup-nft-name">{selectedNFT.name}</div>
            <input
              type="number"
              min="0"
              placeholder="Price"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="price-input"
            />
            <select
              className="token-dropdown"
              value={tokenSymbol || ""}
              onChange={(e) => setTokenSymbol(e.target.value)}
            >
              {tokenSymbol ? (
                <option value={tokenSymbol}>{tokenSymbol}</option>
              ) : (
                <option value="">Loading...</option>
              )}
            </select>
          </div>

          <div className="row row-bottom">
            <div className="line">
              <span>You receive</span>
              <span>{receiveAmount.toFixed(4)} {tokenSymbol}</span>
            </div>
            <div className="line">
              <span>Total Price</span>
              <span>{priceNum.toFixed(4)} {tokenSymbol}</span>
            </div>
            <div className="line">
              <span>Platform Fee ({platformFeePercent}%)</span>
              <span>-{feeAmount.toFixed(4)} {tokenSymbol}</span>
            </div>
          </div>
        </div>

        {/* Card 4: Actions */}
        <div className="user-popup-action-card">
          <button className="user-popup-button list" onClick={handleSubmit} disabled={loading}>
            {loading ? "Listing..." : "List"}
          </button>
          <button className="user-popup-button cancel" onClick={onClose}>Cancel</button>
        </div>
      </div>
    </div>
  );
}

export default UserPopup;
