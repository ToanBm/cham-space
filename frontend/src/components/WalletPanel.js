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
import FaucetPopup from "./FaucetPopup";

let lastFetchTime = 0;

function WalletPanel({ onWalletConnected }) {
    const [signer, setSigner] = useState(null);
    const [walletAddress, setWalletAddress] = useState("");
    const [selectedChain, setSelectedChain] = useState("MONAD");
    const [balance, setBalance] = useState(null);
    const [showFaucet, setShowFaucet] = useState(false);

    // ✅ Chỉ lấy localStorage trong browser
    useEffect(() => {
        if (typeof window !== "undefined") {
            const saved = localStorage.getItem("selectedChain");
            if (saved) setSelectedChain(saved);
        }
    }, []);

    // ✅ Đợi ví inject xong rồi mới reconnect + setup listeners
    useEffect(() => {
        if (typeof window === "undefined") return;

        let retries = 0;
        const maxRetries = 10;
        let listenersAttached = false;

        const waitForEthereum = () => {
            const eth = window.okxwallet || window.ethereum;
            if (eth && eth.request && !listenersAttached) {
                reconnect();
                setupListeners(eth);
                listenersAttached = true;
            } else if (retries < maxRetries) {
                retries++;
                setTimeout(waitForEthereum, 300);
            }
        };

        const setupListeners = (eth) => {
            eth.on("accountsChanged", (accounts) => {
                if (accounts.length === 0) disconnect();
                else connect();
            });

            eth.on("chainChanged", async (_chainId) => {
                console.log("🔁 Chain changed:", _chainId);
                await reconnect();
            });
        };

        waitForEthereum();
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

    async function connect() {
        const wallet = await connectWallet();
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
        if (!provider || !address) {
            console.warn("⚠️ Missing provider or address in loadBalance");
            return;
        }

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
                    <button className="wallet-button" onClick={connect}>
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

            {showFaucet && (
                <FaucetPopup
                    onClose={() => setShowFaucet(false)}
                />
            )}
        </div>
    );
}

export default WalletPanel;