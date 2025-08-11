// utils/connectWallet.js
import { BrowserProvider } from "ethers";
import { CHAINS } from "./chains";

// Progressive enhancement: detect provider
function getEthereum() {
    return window.okxwallet || window.ethereum || null;
}

// Get supported chain IDs
function getSupportedChainIds() {
    return [10143, 50312, 16601, 5115]; // MONAD, SOMNIA, OG, CITREA
}



// Request network switch with better UX
async function requestNetworkSwitch(chainInfo) {
    const eth = getEthereum();
    if (!eth) throw new Error("No wallet provider found");

    try {
        // Try to switch to the target chain
        await eth.request({
            method: "wallet_switchEthereumChain",
            params: [{ chainId: "0x" + chainInfo.chainId.toString(16) }],
        });
    } catch (switchError) {
        // If chain not added, add it
        if (switchError.code === 4902) {
            await eth.request({
                method: "wallet_addEthereumChain",
                params: [{
                    chainId: "0x" + chainInfo.chainId.toString(16),
                    chainName: chainInfo.chainName,
                    nativeCurrency: chainInfo.nativeCurrency,
                    rpcUrls: chainInfo.rpcUrls,
                    blockExplorerUrls: chainInfo.blockExplorerUrls,
                }],
            });
        } else {
            throw switchError;
        }
    }
}

export async function connectWallet() {
    const eth = getEthereum();

    if (!eth) {
        throw new Error("No Ethereum provider found. Please install MetaMask or OKX Wallet.");
    }

    try {
        console.log("🔌 Connecting to wallet...");

        // Step 1: Request accounts
        const accounts = await eth.request({ method: "eth_requestAccounts" });
        if (!accounts || accounts.length === 0) {
            throw new Error("No accounts returned");
        }

        // Step 2: Create provider and get wallet info
        const provider = new BrowserProvider(eth);
        const signer = await provider.getSigner();
        const address = await signer.getAddress();
        const network = await provider.getNetwork();
        const currentChainId = Number(network.chainId);

        console.log("✅ Wallet connected successfully");
        
        // Step 3: Check network and auto-request switch if needed
        const supportedChains = getSupportedChainIds();
        const isSupported = supportedChains.includes(currentChainId);
        
        console.log("🔍 Network check:", {
            currentChainId,
            supportedChains,
            isSupported
        });
        
        if (!isSupported) {
            console.log("⚠️ Connected to unsupported network, requesting switch...");
            // Auto-request network switch to the first supported network
            try {
                const firstSupportedChain = Object.values(CHAINS)[0]; // Get first supported chain
                await requestNetworkSwitch(firstSupportedChain);
                console.log("✅ Network switch requested to:", firstSupportedChain.chainName);
            } catch (switchError) {
                console.warn("⚠️ Could not request network switch:", switchError);
            }
        }
        
        return {
            provider,
            signer,
            address,
            chainId: currentChainId,
            isSupportedNetwork: isSupported
        };
    } catch (err) {
        console.error("❌ Wallet connection failed:", err);
        
        if (err.code === 4001) {
            throw new Error("Connection rejected by user");
        }
        
        throw err; // Re-throw the original error
    }
}

export async function getExistingWallet() {
    const eth = getEthereum();
    if (!eth) return null;

    try {
        const accounts = await eth.request({ method: "eth_accounts" });
        if (accounts.length === 0) return null;

        const provider = new BrowserProvider(eth);
        const signer = await provider.getSigner();
        const network = await provider.getNetwork();
        const currentChainId = Number(network.chainId);
        
        // Check network and auto-request switch if needed
        const supportedChains = getSupportedChainIds();
        const isSupported = supportedChains.includes(currentChainId);
        
        if (!isSupported) {
            console.warn(`⚠️ Connected to unsupported network: ${currentChainId}, requesting switch...`);
            // Auto-request network switch to the first supported network
            try {
                const firstSupportedChain = Object.values(CHAINS)[0];
                await requestNetworkSwitch(firstSupportedChain);
                console.log("✅ Network switch requested to:", firstSupportedChain.chainName);
            } catch (switchError) {
                console.warn("⚠️ Could not request network switch:", switchError);
            }
        }

        return {
            provider,
            signer,
            address: await signer.getAddress(),
            chainId: currentChainId,
            isSupportedNetwork: isSupported
        };
    } catch (err) {
        console.error("❌ Existing wallet validation failed:", err);
        return null;
    }
}

export function disconnectWallet() {
    console.log("🔌 Wallet disconnected");
    // Note: Browser wallets don't support programmatic disconnect
}

export async function switchNetwork(chainInfo) {
    const eth = getEthereum();
    if (!eth) throw new Error("No wallet provider found");

    try {
        // Switch to the specified chain
        await requestNetworkSwitch(chainInfo);
        console.log("✅ Network switched to", chainInfo.chainName);
    } catch (err) {
        console.error("❌ Network switch failed:", err);
        
        // Provide more specific error messages
        if (err.code === 4001) {
            throw new Error("Network switch was rejected by user");
        } else if (err.code === 4902) {
            throw new Error("Network not found. Please add it to your wallet first");
        } else if (err.message.includes("already")) {
            // Network is already the current network
            console.log("ℹ️ Already on the requested network");
            return;
        } else {
            throw new Error("Failed to switch network. Please try switching manually in your wallet.");
        }
    }
}

// Marketplace-specific: Check if wallet is ready for transactions
export async function isWalletReady() {
    try {
        const wallet = await getExistingWallet();
        if (!wallet) return false;
        
        // Wallet is ready if connected, regardless of network
        return true;
    } catch (error) {
        return false;
    }
}
