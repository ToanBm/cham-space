// components/WalletPanel.js
import { useEffect, useState } from "react";
import {
    connectWallet,
    getExistingWallet,
    disconnectWallet,
    switchNetwork,
    isWalletReady,
} from "../utils/connectWallet";
import { CHAINS } from "../utils/chains";
import CustomNetworkSelector from "./CustomNetworkSelector";
import { ethers, formatEther, BrowserProvider } from "ethers";
import FaucetPopup from "./FaucetPopup";

let lastFetchTime = 0;

function WalletPanel({ onWalletConnected }) {
    const [signer, setSigner] = useState(null);
    const [walletAddress, setWalletAddress] = useState("");
    const [selectedChain, setSelectedChain] = useState("MONAD");
    const [balance, setBalance] = useState(null);
    const [isConnecting, setIsConnecting] = useState(false);
    const [error, setError] = useState(null);
    const [showFaucet, setShowFaucet] = useState(false);

    useEffect(() => {
        if (typeof window !== "undefined") {
            const saved = localStorage.getItem("selectedChain");
            if (saved) setSelectedChain(saved);
        }
    }, []);

    // Auto-check current network on mount
    useEffect(() => {
        if (typeof window === "undefined") return;
        
        const checkCurrentNetwork = async () => {
            try {
                const eth = window.okxwallet || window.ethereum;
                if (!eth || !eth.request) return;
                
                const accounts = await eth.request({ method: "eth_accounts" });
                if (accounts.length === 0) return; // No wallet connected
                
                const provider = new BrowserProvider(eth);
                const network = await provider.getNetwork();
                const currentChainId = Number(network.chainId);
                
                // Find matching chain from CHAINS
                const matchingChain = Object.entries(CHAINS).find(([key, chain]) => 
                    chain.chainId === currentChainId
                );
                
                if (matchingChain) {
                    const [chainKey] = matchingChain;
                    setSelectedChain(chainKey);
                    localStorage.setItem("selectedChain", chainKey);
                    console.log("✅ Auto-detected current network:", chainKey);
                }
            } catch (error) {
                console.warn("⚠️ Could not check current network:", error);
            }
        };
        
        // Wait a bit for wallet to be ready
        setTimeout(checkCurrentNetwork, 1000);
    }, []);

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
                await reconnect();
            });
        };

        waitForEthereum();
    }, []);

    async function reconnect() {
        try {
            const wallet = await getExistingWallet();
            if (wallet?.signer) {
                setSigner(wallet.signer);
                const address = await wallet.signer.getAddress();
                setWalletAddress(address);
                onWalletConnected?.(wallet);

                const provider = wallet.signer.provider;
                await loadBalance(provider, address);
                
                // Auto-detect current network and update selectedChain
                try {
                    const network = await provider.getNetwork();
                    const currentChainId = Number(network.chainId);
                    
                    // Find matching chain from CHAINS
                    const matchingChain = Object.entries(CHAINS).find(([key, chain]) => 
                        chain.chainId === currentChainId
                    );
                    
                    if (matchingChain) {
                        const [chainKey] = matchingChain;
                        setSelectedChain(chainKey);
                        localStorage.setItem("selectedChain", chainKey);
                        setError(null);
                    }
                } catch (networkError) {
                    // Ignore network detection errors
                }
            }
        } catch (err) {
            console.error("❌ Reconnect failed:", err);
            setError(err.message);
        }
    }

    async function connect() {
        if (isConnecting) return;
        
        setIsConnecting(true);
        setError(null);
        
        try {
            const wallet = await connectWallet();
            if (wallet) {
                setSigner(wallet.signer);
                const address = await wallet.signer.getAddress();
                setWalletAddress(address);
                onWalletConnected?.(wallet);

                const provider = wallet.signer.provider;
                await loadBalance(provider, address);
                
                // Auto-detect current network and update selectedChain
                try {
                    const network = await provider.getNetwork();
                    const currentChainId = Number(network.chainId);
                    
                    // Find matching chain from CHAINS
                    const matchingChain = Object.entries(CHAINS).find(([key, chain]) => 
                        chain.chainId === currentChainId
                    );
                    
                    if (matchingChain) {
                        const [chainKey] = matchingChain;
                        setSelectedChain(chainKey);
                        localStorage.setItem("selectedChain", chainKey);
                    }
                } catch (networkError) {
                    console.warn("⚠️ Could not auto-detect network:", networkError);
                }
            }
        } catch (err) {
            console.error("❌ Connection failed:", err);
            setError(err.message);
        } finally {
            setIsConnecting(false);
        }
    }

    function disconnect() {
        disconnectWallet();
        setSigner(null);
        setWalletAddress("");
        setError(null);
    }

    async function handleSwitchNetwork(chainKey) {
        if (chainKey === "DISCONNECT") {
            disconnect();
            return;
        }
        
        if (!["MONAD", "SOMNIA", "OG", "CITREA"].includes(chainKey)) return;
        
        try {
            setError(null);
            const chainInfo = CHAINS[chainKey];
            await switchNetwork(chainInfo);
            localStorage.setItem("selectedChain", chainKey);
            setSelectedChain(chainKey);
        } catch (err) {
            console.error("❌ Network switch failed:", err);
            setError(err.message);
        }
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
            const formatted = parseFloat(formatEther(raw)).toFixed(2);
            setBalance(formatted);
        } catch (err) {
            console.error("❌ Failed to fetch balance:", err);
        }
    }

    return (
        <div className="network-panel">
            {/* Error Display */}
            {error && (
                <div className="error-message">
                    ⚠️ {error}
                    <button onClick={() => setError(null)}>×</button>
                </div>
            )}
            
            <div className="network-row">
                {!signer ? (
                    <button 
                        className={`wallet-button ${isConnecting ? 'connecting' : ''}`} 
                        onClick={connect}
                        disabled={isConnecting}
                    >
                        {isConnecting ? "Connecting..." : "Connect Wallet"}
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

            <button className="faucet-button" onClick={() => setShowFaucet(true)}>
                Faucet
            </button>

            {showFaucet && (
                <FaucetPopup
                    onClose={() => setShowFaucet(false)}
                />
            )}
        </div>
    );
}

export default WalletPanel;