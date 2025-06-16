// components/ConnectWalletPopup.js
import "../styles/ConnectWalletPopup.css";

function ConnectWalletPopup({ onClose, onSelect }) {
    const wallets = [
        { name: "OKX Wallet", icon: "/icon/okx.svg", key: "okx" },
        { name: "MetaMask", icon: "/icon/metamask.svg", key: "metamask" },
    ];

    return (
        <div className="connect-popup-overlay">
            <div className="connect-wallet-popup">
                <div className="connect-popup-header">
                    <span>Connect Wallet</span>
                    <button className="connect-popup-close" onClick={onClose}>×</button>
                </div>
                <div className="connect-wallet-list">
                    {wallets.map((wallet) => (
                        <div key={wallet.key} className="connect-wallet-item" onClick={() => onSelect(wallet.key)}>
                            <span>{wallet.name}</span>
                            <img src={wallet.icon} alt={wallet.name} />
                        </div>
                    ))}
                </div>
                <button className="connect-more-wallets">↓ More Available</button>
            </div>
        </div>
    );
}

export default ConnectWalletPopup;
