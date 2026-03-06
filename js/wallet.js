// ============================================================
// wallet.js — MetaMask connection + RBG Happi token verification
// Connects to user's wallet and checks if they own the
// RBG Matsuri Happi Coat: RED (ERC-721 on Ethereum mainnet)
// ============================================================

// The RBG Happi Coat contract on Ethereum mainnet (from Manifold)
const HAPPI_CONTRACT = '0x997db8679c9c503df27ecc5c57caf583c18c7d92';

// ERC-721 ABI — we only need balanceOf to check ownership
// balanceOf(address) returns how many tokens that address holds
const ERC721_ABI = [
  'function balanceOf(address owner) view returns (uint256)',
  'function tokenOfOwnerByIndex(address owner, uint256 index) view returns (uint256)'
];

// Ethereum mainnet chain ID (in hex)
const ETH_MAINNET_CHAIN_ID = '0x1';

// ---- CHECK IF METAMASK IS INSTALLED ----
function hasMetaMask() {
  return typeof window.ethereum !== 'undefined' && window.ethereum.isMetaMask;
}

// ---- CONNECT WALLET ----
// Prompts MetaMask to connect and returns the wallet address
async function connectWallet() {
  if (!hasMetaMask()) {
    throw new Error('MetaMask is not installed. Please install it from metamask.io');
  }

  // Request the user's wallet accounts (triggers MetaMask popup)
  const accounts = await window.ethereum.request({
    method: 'eth_requestAccounts'
  });

  // accounts[0] is the currently selected wallet address
  if (!accounts || accounts.length === 0) {
    throw new Error('No accounts found. Please unlock MetaMask.');
  }

  return accounts[0]; // returns the wallet address like "0xABC...DEF"
}

// ---- ENSURE WE'RE ON ETHEREUM MAINNET ----
// The Happi contract is on Ethereum mainnet, so we need to be on the right chain
async function ensureEthereumMainnet() {
  const currentChainId = await window.ethereum.request({ method: 'eth_chainId' });

  if (currentChainId !== ETH_MAINNET_CHAIN_ID) {
    // Ask MetaMask to switch to Ethereum mainnet
    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: ETH_MAINNET_CHAIN_ID }],
      });
    } catch (error) {
      throw new Error('Please switch to Ethereum Mainnet in MetaMask to verify your Happi token.');
    }
  }
}

// ---- CHECK HAPPI TOKEN OWNERSHIP ----
// Calls the smart contract to see if the wallet owns any RBG Happi tokens
// Returns { owns: true/false, count: number }
async function checkHappiOwnership(walletAddress) {
  // Make sure we're on Ethereum mainnet first
  await ensureEthereumMainnet();

  // Create an ethers.js provider using MetaMask's connection
  const provider = new ethers.BrowserProvider(window.ethereum);

  // Create a read-only contract instance (we're only reading data, not sending transactions)
  const contract = new ethers.Contract(HAPPI_CONTRACT, ERC721_ABI, provider);

  // balanceOf returns how many tokens this address holds
  const balance = await contract.balanceOf(walletAddress);
  const count = Number(balance); // convert from BigNumber to regular number

  return {
    owns: count > 0,
    count: count
  };
}

// ---- TRUNCATE WALLET ADDRESS FOR DISPLAY ----
// Turns "0x86ed56ff2e7aef671f9e23db5ccccc9f5a8dfe78" into "0x86ed...fe78"
function truncateAddress(address) {
  if (!address) return '';
  return address.slice(0, 6) + '...' + address.slice(-4);
}

// ---- FULL CONNECT + VERIFY FLOW ----
// Connects wallet, checks ownership, and updates the Supabase profile
// Returns { address, owns, count } or throws an error
async function connectAndVerify(userId) {
  // Step 1: Connect MetaMask
  const address = await connectWallet();

  // Step 2: Check Happi token ownership
  const { owns, count } = await checkHappiOwnership(address);

  // Step 3: Save to Supabase profile
  await updateProfile(userId, {
    wallet_address: address,
    owns_happi: owns,
    happi_token_count: count,
    wallet_verified_at: new Date().toISOString()
  });

  return { address, owns, count };
}
