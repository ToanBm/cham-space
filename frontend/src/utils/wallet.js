import { connectWallet } from "../utils/wallet";

async function handleConnect() {
  const walletInfo = await connectWallet();
  if (walletInfo) {
    console.log("Connected address:", walletInfo.address);
    // setState(walletInfo) hoặc xử lý theo app của bạn
  }
}
