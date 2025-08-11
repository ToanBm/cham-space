// ====================== IMPORTS ======================
import { useState, useEffect } from "react";
import { BrowserProvider, Contract, ethers, JsonRpcProvider } from "ethers";
import { nfts as nftList } from "../utils/nfts";
import { marketNftAbi } from "../abi/marketNftAbi";
import MintPopup from "./MintPopup";
import ListingPanel from "./ListingPanel";
import ListingPopup from "./ListingPopup";

function MarketPanel({ signer }) {
  const [selectedChain, setSelectedChain] = useState("ALL");
  const [minted, setMinted] = useState({});
  const [mintingIndex, setMintingIndex] = useState(null);
  const [listingMap, setListingMap] = useState({});
  const [buyingId, setBuyingId] = useState(null);
  const [selectedNFT, setSelectedNFT] = useState(null);
  const [tradePopupData, setTradePopupData] = useState(null);
  const [activeTab, setActiveTab] = useState("Market");
  const [page, setPage] = useState(0);
  const nftsPerPage = 6;

  const now = Date.now();

  const filteredNFTs =
    selectedChain === "ALL"
      ? nftList
      : nftList.filter((nft) => nft.chain === selectedChain);

  const visibleNFTs = filteredNFTs.slice(page * nftsPerPage, (page + 1) * nftsPerPage);
  const hasPrev = page > 0;
  const hasNext = (page + 1) * nftsPerPage < filteredNFTs.length;

  const collectionStatsAllChains = nftList.map((nft) => {
    const items = listingMap[nft.contract] || [];
    if (items.length === 0) return null;

    const floor = Math.min(...items.map(i => parseFloat(i.price))).toFixed(3);
    const volume = items.reduce((sum, i) => sum + parseFloat(i.price), 0).toFixed(2);

    return {
      ...nft,
      floor,
      volume,
    };
  }).filter(Boolean);

  useEffect(() => {
    async function fetchMintedAndListed() {
      const mintedData = {};
      const listingData = {};

      for (let nft of nftList) {
        if (!nft.contract || !nft.abi || !nft.rpc) continue;

        try {
          const provider = new JsonRpcProvider(nft.rpc);
          const contract = new Contract(nft.contract, nft.abi, provider);
          const count = await contract.totalSupply();
          mintedData[nft.contract] = count.toString();

          const listed = [];
          for (let i = 1; i <= count; i++) {
            try {
              const price = await contract.salePrice(i);
              if (price > 0n) {
                const tokenURI = await contract.tokenURI(i);
                const res = await fetch(tokenURI);
                if (!res.ok) continue;
                const metadata = await res.json();
                listed.push({
                  tokenId: i,
                  price: ethers.formatEther(price),
                  name: metadata.name,
                  image: metadata.image,
                  contract: nft.contract,
                  abi: nft.abi,
                  nativeSymbol: nft.nativeSymbol,
                  chain: nft.chain,
                  networkIcon: nft.networkIcon,
                });
              }
            } catch { }
          }
          listingData[nft.contract] = listed;
        } catch (err) {
          console.warn("Skipping", nft.name, "due to error:", err);
          mintedData[nft.contract] = "0";
        }
      }

      setMinted(mintedData);
      setListingMap(listingData);
    }

    if (window.ethereum) fetchMintedAndListed();
  }, []);

  function formatCountdown(ms) {
    const sec = Math.floor(ms / 1000);
    const min = Math.floor(sec / 60);
    const hr = Math.floor(min / 60);
    const day = Math.floor(hr / 24);
    const h = hr % 24;
    const m = min % 60;
    return `${day}d ${h}h ${m}m`;
  }

  const CHAIN_ICONS = {
    ALL: { icon: "/icon/monad.png", label: "All Chains" },
    MONAD: { icon: "/icon/monad.png", label: "Monad" },
    SOMNIA: { icon: "/icon/somnia.png", label: "Somnia" },
    OG: { icon: "/icon/og.png", label: "0G-Galileo" },
    CITREA: { icon: "/icon/citrea.png", label: "Citrea" },
  };

  return (
    <div className="market-panel">
      <div className="top-bar">
        <div className="page-control-card">
          <h2 className="section-title with-logo">
            <img src="/icon/logo.png" alt="" className="section-logo" />
            ChamSpace
          </h2>
          <div className="page-tabs">
            <button
              className={`page-tab ${activeTab === "Market" ? "active" : ""}`}
              onClick={() => setActiveTab("Market")}
            >
              Market
            </button>
            <button
              className={`page-tab ${activeTab === "Create" ? "active" : ""}`}
              onClick={() => setActiveTab("Create")}
            >
              Create (Soon...)
            </button>
          
          </div>
          <div className="spacer" />
          <div className="search-box">
            <input type="text" placeholder="Search..." />
          </div>
        </div>

        <div className="chain-tab-card">
          <div className="chain-tabs">
            {Object.entries(CHAIN_ICONS).map(([chain, { icon, label }]) => (
              <button
                key={chain}
                className={`chain-tab ${selectedChain === chain ? "active" : ""}`}
                onClick={() => setSelectedChain(chain)}
              >
                {chain !== "ALL" && <img src={icon} alt={label} />}
                {chain === "ALL"
                  ? <span className="chain-label">{label}</span>
                  : selectedChain === chain && <span className="chain-label">{label}</span>}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="nft-section">
        <h3 className="section-title">Upcoming & Active Drops</h3>

        <div className="nft-grid-wrapper">
          {hasNext && (
            <div className="arrow-card right">
              <button className="arrow-button" onClick={() => setPage(page + 1)}>
                ❯
              </button>
            </div>
          )}

          <div className="nft-grid">
            {visibleNFTs.map((nft, index) => {
              const start = Date.parse(nft.mintStart);
              const end = Date.parse(nft.mintEnd);
              const mintedCount = minted[nft.contract] || "0";
              const mintedPercent = Math.floor((mintedCount / nft.supply) * 100) || 0;
              const isMintLive = now >= start && now < end;
              const isMintSoon = now < start;

              return (
                <div key={index} className="nft-card">
                  {nft.networkIcon && (
                    <img src={nft.networkIcon} alt="icon" className="network-icon" />
                  )}
                  <div className="nft-image-wrapper">
                    <img src={nft.image} className="nft-image" alt={nft.name} />
                  </div>
                  <div className="nft-name">{nft.name}</div>
                  <div className="nft-info-labels">
                    <div>PRICE</div>
                    <div>ITEMS</div>
                    <div>MINTED</div>
                  </div>
                  <div className="nft-info-values">
                    <div>{nft.price}</div>
                    <div>{nft.supply}</div>
                    <div>{mintedPercent}%</div>
                  </div>
                  <div className="nft-status-box">
                    {isMintLive ? (
                      <span>
                        <span className="status-dot">● Live</span>
                        <span className="status-label"> · Ends: </span>
                        <span className="status-time">{formatCountdown(end - now)}</span>
                      </span>
                    ) : isMintSoon ? (
                      <span className="status-label">
                        Starts: <span className="status-time">{formatCountdown(start - now)}</span>
                      </span>
                    ) : (
                      <span className="status-label">Ended</span>
                    )}
                  </div>
                  {isMintLive && (
                    <div className="nft-mint-overlay">
                      <button
                        className="mint-button"
                        onClick={() => setSelectedNFT(nft)}
                      >
                        Mint
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {hasPrev && (
            <div className="arrow-card left">
              <button className="arrow-button" onClick={() => setPage(page - 1)}>
                ❮
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="nft-card empty">
        <div className="nft-card-inner">
          <div className="empty-message">More collections coming soon...</div>
        </div>
      </div>

      <ListingPanel
        filteredNFTs={collectionStatsAllChains}
        listingMap={listingMap}
      />

      {tradePopupData && (
        <ListingPopup
          collectionName={tradePopupData.collectionName}
          chain={tradePopupData.chain}
          nfts={tradePopupData.nfts}
          onClose={() => setTradePopupData(null)}
        />
      )}

      {selectedNFT && (
        <MintPopup
          nft={selectedNFT}
          signer={signer}
          onClose={() => setSelectedNFT(null)}
          onSuccess={() => {
            setSelectedNFT(null);
            setMintingIndex(null);
          }}
        />
      )}
    </div>
  );
}

export default MarketPanel;
