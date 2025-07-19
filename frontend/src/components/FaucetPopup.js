// components/FaucetPopup.js
import { CHAINS } from "../utils/chains";
import "../styles/FaucetPopup.css";

function FaucetPopup({ onClose }) {
    return (
        <div className="connect-popup-overlay">
            <div className="connect-wallet-popup">
                <div className="connect-popup-header">
                    <span>Request Faucet</span>
                    <button className="connect-popup-close" onClick={onClose}>×</button>
                </div>
                <div className="connect-wallet-list">
                    {Object.entries(CHAINS)
                        .filter(([key]) => ["MONAD", "SOMNIA", "OG"].includes(key))
                        .map(([key, chain]) => (
                            <a
                                key={key}
                                href={chain.faucetUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="connect-wallet-item"
                            >
                                <span>{chain.chainName}</span>
                                <img src={chain.networkIcon} alt={chain.chainName} />
                            </a>
                        ))}
                </div>
                <div className="connect-more-wallets" onClick={onClose}>Close</div>
            </div>
        </div>
    );
}

export default FaucetPopup;
