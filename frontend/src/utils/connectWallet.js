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
    if (!eth) {
        throw new Error("No wallet provider found");
    }

    try {
        // Try to switch to the target chain
        const switchResult = await eth.request({
            method: "wallet_switchEthereumChain",
            params: [{ chainId: "0x" + chainInfo.chainId.toString(16) }],
        });
        
        return switchResult;
        
    } catch (switchError) {
        // If chain not added, add it
        if (switchError.code === 4902) {
            try {
                const addResult = await eth.request({
                    method: "wallet_addEthereumChain",
                    params: [{
                        chainId: "0x" + chainInfo.chainId.toString(16),
                        chainName: chainInfo.chainName,
                        nativeCurrency: chainInfo.nativeCurrency,
                        rpcUrls: chainInfo.rpcUrls,
                        blockExplorerUrls: chainInfo.blockExplorerUrls,
                    }],
                });
                return addResult;
            } catch (addError) {
                throw addError;
            }
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

        // Step 3: Check network and auto-request switch if needed
        const supportedChains = getSupportedChainIds();
        const isSupported = supportedChains.includes(currentChainId);
        
        if (!isSupported) {
            // Auto-request network switch to the first supported network
            try {
                const firstSupportedChain = Object.values(CHAINS)[0]; // Get first supported chain
                await requestNetworkSwitch(firstSupportedChain);
            } catch (switchError) {
                // Ignore switch errors during connection
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
            // Auto-request network switch to the first supported network
            try {
                const firstSupportedChain = Object.values(CHAINS)[0];
                await requestNetworkSwitch(firstSupportedChain);
            } catch (switchError) {
                // Ignore switch errors during existing wallet check
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
    } catch (err) {
        // Provide more specific error messages
        if (err.code === 4001) {
            throw new Error("Network switch was rejected by user");
        } else if (err.code === 4902) {
            throw new Error("Network not found. Please add it to your wallet first");
        } else if (err.message.includes("already")) {
            // Network is already the current network
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

// New function: Check and auto-switch network for specific actions
export async function ensureCorrectNetwork(requiredChainKey) {
    const eth = getEthereum();
    if (!eth) {
        throw new Error("No wallet provider found");
    }

    try {
        // Get current network
        const provider = new BrowserProvider(eth);
        const network = await provider.getNetwork();
        const currentChainId = Number(network.chainId);
        
        // Get required chain info
        const requiredChain = CHAINS[requiredChainKey];
        if (!requiredChain) {
            throw new Error(`Unknown chain: ${requiredChainKey}`);
        }
        
        // Check if already on correct network
        if (currentChainId === requiredChain.chainId) {
            return true;
        }
        
        // Request network switch
        try {
            await requestNetworkSwitch(requiredChain);
            return true;
        } catch (switchError) {
            throw switchError;
        }
        
    } catch (err) {
        throw new Error(`Please switch to ${requiredChainKey} network to continue`);
    }
}
