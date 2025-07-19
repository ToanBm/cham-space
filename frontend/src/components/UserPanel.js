import { useEffect, useState } from "react";
import { BrowserProvider, Contract } from "ethers";
import { nfts as nftList } from "../utils/nfts";
import UserPopup from "./UserPopup";

function UserNFTs({ signer }) {
  const [nfts, setNfts] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedNFT, setSelectedNFT] = useState(null);
  const nftsPerPage = 6;

  useEffect(() => {
    loadAllNFTs();
  }, [loadAllNFTs]);

  async function loadAllNFTs() {
    const address = await signer.getAddress();
    const allNfts = [];

    // Chạy song song cho từng contract
    await Promise.all(nftList.map(async (nft) => {
      try {
        const contract = new Contract(nft.contract, nft.abi, signer);
        const balance = await contract.balanceOf(address);

        if (balance === 0) return; // Skip nếu không có NFT

        // Lấy tất cả tokenId song song
        const tokenIdPromises = [];
        for (let i = 0; i < balance; i++) {
          tokenIdPromises.push(contract.tokenOfOwnerByIndex(address, i));
        }
        const tokenIds = await Promise.all(tokenIdPromises);

        // Lấy metadata và salePrice song song cho từng token
        await Promise.all(tokenIds.map(async (tokenId) => {
          try {
            const [tokenUri, salePrice] = await Promise.all([
              contract.tokenURI(tokenId),
              contract.salePrice(tokenId)
            ]);

            const res = await fetch(tokenUri);
            if (!res.ok) return;
            const metadata = await res.json();

            const isListed = salePrice !== 0n;
            const fullName = metadata.name || nft.name;
            const nameOnly = fullName.replace(/\s*#\d+$/, "");

            allNfts.push({
              id: tokenId.toString(),
              name: nameOnly,
              image: metadata.image || "",
              contract: nft.contract,
              tokenId,
              abi: nft.abi,
              chain: nft.chain,
              nativeSymbol: nft.nativeSymbol,
              networkIcon: nft.networkIcon,
              price: nft.price,
              isListed,
            });
          } catch (error) {
            console.warn(`Failed to load token ${tokenId} from ${nft.contract}:`, error);
          }
        }));
      } catch (error) {
        console.warn(`Failed to load contract ${nft.contract}:`, error);
      }
    }));

    setNfts(allNfts);
  }

  async function handleCancelListing(nft) {
    try {
      const provider = new BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new Contract(nft.contract, nft.abi, signer);
      const tx = await contract.cancelListing(nft.tokenId);
      await tx.wait();
      alert("✅ Cancelled listing for token " + nft.tokenId);
      await loadAllNFTs(); // ✅ bắt buộc phải await
    } catch (err) {
      alert("❌ Cancel failed: " + (err?.info?.error?.message || err.message));
    }
  }

  const startIndex = (currentPage - 1) * nftsPerPage;
  const currentNfts = nfts.slice(startIndex, startIndex + nftsPerPage);
  const totalPages = Math.ceil(nfts.length / nftsPerPage);

  async function handleList(info) {
    console.log("✅ Listed NFT:", info);
    alert(`NFT ${info.name} listed at ${info.price}`);
    await loadAllNFTs(); // ✅ bắt buộc phải await
  }

  return (
    <div className="user-panel">
      <h3 className="section-title">Owned NFTs</h3>
      <div className="user-nft-grid">
        {currentNfts.map((nft) => (
          <div
            key={`${nft.contract}-${nft.id}`}
            className={`nft-card fade-in ${nft.isListed ? "listed" : ""}`}
          >
            <div className="nft-image-wrapper">
              <span className="nft-id">#{nft.id}</span> {/* ID ở góc trên trái */}
              <img src={nft.image} className="nft-image" />
              <div className="nft-name">{nft.name}</div> {/* tên nằm trên ảnh */}
            </div>
            <div className="nft-name">{nft.name}</div>

            {nft.isListed && <span className="badge-listed">Listed</span>}

            {nft.isListed ? (
              <button
                className="cancel-button"
                onClick={() => handleCancelListing(nft)}
              >
                Cancel Listing
              </button>
            ) : (
              <button
                className="list-button"
                onClick={() => setSelectedNFT(nft)}
              >
                List for Sale
              </button>
            )}
          </div>
        ))}
      </div>

      {totalPages > 1 && (
        <div className="pagination fixed-bottom">
          <button
            onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
            disabled={currentPage === 1}
          >
            ❮
          </button>
          <span>
            Page {currentPage} / {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
            disabled={currentPage === totalPages}
          >
            ❯
          </button>
        </div>
      )}

      {selectedNFT && (
        <UserPopup
          selectedNFT={selectedNFT}
          onClose={() => setSelectedNFT(null)}
          onList={handleList}
        />
      )}
    </div>
  );
}

export default UserNFTs;
