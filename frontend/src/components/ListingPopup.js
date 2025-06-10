import { useState } from "react";
import { ethers } from "ethers";
import "../styles/ListingPopup.css";

function ListingPopup({ collectionName, chain, nfts, onClose }) {
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState("grid");
  const [buying, setBuying] = useState(false);

  const filteredNfts = nfts.filter((nft) =>
    nft.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleBuy = async (nft) => {
    if (!window.ethereum) {
      alert("Please connect your wallet.");
      return;
    }

    try {
      setBuying(true);
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(nft.contract, nft.abi, signer);

      const tx = await contract.buy(nft.tokenId, {
        value: ethers.parseEther(nft.price.toString())
      });
      await tx.wait();

      alert(`✅ Successfully bought NFT #${nft.tokenId}`);
    } catch (err) {
      console.error("❌ Buy failed:", err);
      alert("❌ Buy failed. Check console for details.");
    } finally {
      setBuying(false);
    }
  };

  return (
    <div className="trade-popup">
      <div className="popup-header">
        <div className="info-card compact">
          <div className="thumbnail-square">
            <img src={nfts[0]?.image} alt="thumbnail" />
          </div>
          <div className="text-info">
            <h2>{collectionName}</h2>
            <p>{chain}</p>
          </div>
        </div>
        <button className="close-button" onClick={onClose}>✕</button>
      </div>

      <div className="trade-controls">
        <input
          type="text"
          placeholder="Search items"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <div className="view-toggle">
          <button onClick={() => setViewMode("grid")}>🔲</button>
          <button onClick={() => setViewMode("list")}>📃</button>
        </div>
      </div>

      <div className={viewMode === "grid" ? "nft-grid" : "nft-list"}>
        {filteredNfts.map((nft, index) => (
          <div key={index} className="trade-nft-card">
            <img src={nft.image} alt={nft.name} className="trade-nft-image" />
            <div className="trade-nft-info">
              <span>#{nft.tokenId}</span>
              <span>
                {nft.price}
                <span className="token-symbol"> {nft.nativeSymbol || "?"}</span>
              </span>
            </div>
            <div className="trade-nft-action">
              <button
                onClick={() => handleBuy(nft)}
                disabled={!window.ethereum || buying}
              >
                {!window.ethereum
                  ? "Connect Wallet"
                  : buying
                  ? "Processing..."
                  : "Buy Now"}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default ListingPopup;
