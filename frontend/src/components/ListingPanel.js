import { useState } from "react";
import ListingPopup from "./ListingPopup";

function ListingPanel({ listingMap }) {
  const [selectedNFT, setSelectedNFT] = useState(null);

  // Extract all collections from listingMap
  const allCollections = Object.entries(listingMap)
    .filter(([, listed]) => listed.length > 0)
    .map(([contract, listed]) => {
      const sample = listed[0];
      return {
        contract,
        name: sample.name.split(" #")[0],
        image: sample.image,
        nativeSymbol: sample.nativeSymbol,
        chain: sample.chain,
        networkIcon: sample.networkIcon,
        floor: Math.min(...listed.map(i => parseFloat(i.price))).toFixed(3),
        volume: listed.reduce((sum, i) => sum + parseFloat(i.price), 0).toFixed(2),
        listed
      };
    });

  const handleCollectionClick = (collection) => {
    const nftsWithSymbol = collection.listed.map((nft) => ({
      ...nft,
      nativeSymbol: collection.nativeSymbol || "?",
    }));

    setSelectedNFT({
      collectionName: collection.name,
      chain: collection.chain,
      nfts: nftsWithSymbol,
    });
  };

  return (
    <div className="nft-section">
      <h3 className="section-title">Listed Collections</h3>
      <div className="nft-grid">
        {allCollections.map((col) => (
          <div
            key={col.contract}
            className="nft-card"
            onClick={() => handleCollectionClick(col)}
            style={{ cursor: "pointer" }}
          >
            {col.networkIcon && (
              <img src={col.networkIcon} alt={`${col.chain} icon`} className="network-icon" />
            )}
            <div className="nft-image-wrapper">
              <img src={col.image} alt={col.name} className="nft-image" />
            </div>
            <div className="nft-name">{col.name}</div>
            <div className="nft-info-labels">
              <div>Floor</div>
              <div>Volume</div>
            </div>
            <div className="nft-info-values">
              <div>{col.floor}</div>
              <div>{col.volume}</div>
            </div>
          </div>
        ))}
      </div>

      {selectedNFT && (
        <ListingPopup
          collectionName={selectedNFT.collectionName}
          chain={selectedNFT.chain}
          nfts={selectedNFT.nfts}
          onClose={() => setSelectedNFT(null)}
        />
      )}
    </div>
  );
}

export default ListingPanel;
