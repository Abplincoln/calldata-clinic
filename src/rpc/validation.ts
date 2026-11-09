export interface TxHashValidationResult {
  isValid: boolean;
  txHash?: `0x${string}`;
  error?: string;
}

/**
 * Validates standard Ethereum/EVM 32-byte transaction hash syntax before network request.
 * Expected format: 0x followed by exactly 64 hexadecimal characters (66 characters total).
 */
export function validateTransactionHash(rawHash: unknown): TxHashValidationResult {
  if (rawHash === null || rawHash === undefined) {
    return {
      isValid: false,
      error: 'Transaction hash is required.',
    };
  }

  if (typeof rawHash !== 'string') {
    return {
      isValid: false,
      error: 'Transaction hash must be a string.',
    };
  }

  const trimmed = rawHash.trim();

  if (trimmed === '') {
    return {
      isValid: false,
      error: 'Transaction hash is empty.',
    };
  }

  if (!trimmed.startsWith('0x') && !trimmed.startsWith('0X')) {
    return {
      isValid: false,
      error: "Transaction hash must begin with a '0x' prefix.",
    };
  }

  if (trimmed.length !== 66) {
    return {
      isValid: false,
      error: `Transaction hash must be exactly 66 characters (received ${trimmed.length}).`,
    };
  }

  const hexBody = trimmed.slice(2);
  if (!/^[0-9a-fA-F]{64}$/.test(hexBody)) {
    return {
      isValid: false,
      error: 'Transaction hash contains invalid hexadecimal characters.',
    };
  }

  return {
    isValid: true,
    txHash: `0x${hexBody.toLowerCase()}` as `0x${string}`,
  };
}
