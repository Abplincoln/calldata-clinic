/**
 * BOT Chain Bohr Testnet configuration and constants.
 */
export const BOT_CHAIN_BOHR_TESTNET = {
  chainId: 968,
  chainIdHex: '0x3c8',
  networkName: 'BOT Chain Bohr Testnet',
  rpcUrl: 'https://rpc.bohr.life',
  explorerUrl: 'https://scan.bohr.life',
  nativeTokenSymbol: 'BOT',
  defaultTimeoutMs: 8000,
} as const;

/**
 * Validates a transaction hash and generates the official testnet explorer link.
 * Only generates the link after a valid 66-character hex hash is provided.
 */
export function buildExplorerTxUrl(txHash: string): string {
  const trimmed = txHash.trim();
  if (!/^0x[0-9a-fA-F]{64}$/.test(trimmed)) {
    throw new Error(`Cannot build explorer link for invalid transaction hash: "${txHash}"`);
  }
  return `${BOT_CHAIN_BOHR_TESTNET.explorerUrl}/tx/${trimmed}`;
}
