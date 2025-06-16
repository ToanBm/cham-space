// components/WalletPanel.js
import { useEffect, useState } from "react";
import {
    connectWallet,
    getExistingWallet,
    disconnectWallet,
    switchNetwork,
} from "../utils/connectWallet";
import { CHAINS } from "../utils/chains";
import CustomNetworkSelector from "./CustomNetworkSelector";
import { ethers } from "ethers";
import ConnectWalletPopup from "./ConnectWalletPopup";
import FaucetPopup from "./FaucetPopup";

let lastFetchTime = 0;

function WalletPanel({ onWalletConnected }) {
    const [signer, setSigner] = useState(null);
    const [walletAddress, setWalletAddress] = useState("");
    const [selectedChain, setSelectedChain] = useState(() => localStorage.getItem("selectedChain") || "MONAD");
    const [balance, setBalance] = useState(null);
    const [showPopup, setShowPopup] = useState(false);
    const [showFaucet, setShowFaucet] = useState(false);

    useEffect(() => {
        reconnect();

        const eth = window.ethereum;
        if (eth) {
            const handleAccountsChanged = (accounts) => {
                if (accounts.length === 0) disconnect();
                else connect();
            };

            const handleChainChanged = async (_chainId) => {
                console.log("🔁 Chain changed:", _chainId);
                await reconnect();
            };

            eth.on("accountsChanged", handleAccountsChanged);
            eth.on("chainChanged", handleChainChanged);

            return () => {
                eth.removeListener("accountsChanged", handleAccountsChanged);
                eth.removeListener("chainChanged", handleChainChanged);
            };
        }
    }, []);

    async function reconnect() {
        const wallet = await getExistingWallet();
        if (wallet?.signer) {
            setSigner(wallet.signer);
            const address = await wallet.signer.getAddress();
            setWalletAddress(address);
            onWalletConnected?.(wallet);

            const provider = wallet.signer.provider;
            await loadBalance(provider, address);
        }
    }

    async function connect(walletKey = "metamask") {
        const wallet = await connectWallet(walletKey);
        if (wallet) {
            setSigner(wallet.signer);
            const address = await wallet.signer.getAddress();
            setWalletAddress(address);
            onWalletConnected?.(wallet);

            const provider = wallet.signer.provider;
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
            console.error("❌ Failed to fetch balance:", err);
        }
    }

    return (
        <div className="network-panel">
            <div className="network-row">
                {!signer ? (
                    <button className="wallet-button" onClick={() => setShowPopup(true)}>
                        Connect Wallet
                    </button>
                ) : (
                    <div className="wallet-button">
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

            <button className="faucet-button" onClick={() => setShowFaucet(true)}>Faucet</button>

            {showPopup && (
                <ConnectWalletPopup
                    onClose={() => setShowPopup(false)}
                    onSelect={async (walletKey) => {
                        setShowPopup(false);
                        await connect(walletKey);
                    }}
                />
            )}

            {showFaucet && (
                <FaucetPopup
                    onClose={() => setShowFaucet(false)}
                />
            )}
        </div>
    );
}

export default WalletPanel;
