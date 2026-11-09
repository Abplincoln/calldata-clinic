import { getAddress, isAddress } from 'viem';
import type { AddressValidationResult } from '../types/decoder';

/**
 * Validates an Ethereum-compatible contract address syntax.
 * Strictly performs client-side format and EIP-55 checksum validation.
 * Does NOT attempt automatic ABI discovery or perform any network calls.
 */
export function validateContractAddress(address: unknown): AddressValidationResult {
  if (address === null || address === undefined) {
    return {
      isValid: false,
      error: 'Contract address is required.',
    };
  }

  if (typeof address !== 'string') {
    return {
      isValid: false,
      error: 'Contract address must be a string.',
    };
  }

  const trimmed = address.trim();

  if (trimmed === '') {
    return {
      isValid: false,
      error: 'Contract address is empty.',
    };
  }

  if (!trimmed.startsWith('0x') && !trimmed.startsWith('0X')) {
    return {
      isValid: false,
      error: "Contract address must begin with a '0x' prefix.",
    };
  }

  if (trimmed.length !== 42) {
    return {
      isValid: false,
      error: `Contract address must be exactly 42 characters (received ${trimmed.length}).`,
    };
  }

  const hexBody = trimmed.slice(2);

  if (!/^[0-9a-fA-F]{40}$/.test(hexBody)) {
    return {
      isValid: false,
      error: 'Contract address contains invalid hexadecimal characters.',
    };
  }

  const normalizedHexAddress = `0x${hexBody}` as `0x${string}`;

  // Basic address validation
  if (!isAddress(normalizedHexAddress, { strict: false })) {
    return {
      isValid: false,
      error: 'Invalid address format.',
    };
  }

  const hasLower = /[a-f]/.test(hexBody);
  const hasUpper = /[A-F]/.test(hexBody);
  const isMixedCase = hasLower && hasUpper;

  const checksummedAddress = getAddress(normalizedHexAddress);

  // If mixed case, EIP-55 checksum must match
  if (isMixedCase && normalizedHexAddress !== checksummedAddress) {
    return {
      isValid: false,
      error: 'Contract address has an invalid EIP-55 checksum.',
    };
  }

  const isChecksummed = isMixedCase && normalizedHexAddress === checksummedAddress;

  return {
    isValid: true,
    address: normalizedHexAddress,
    checksummedAddress,
    isChecksummed,
  };
}

/**
 * Simple boolean helper for contract address validity.
 */
export function isValidContractAddress(address: unknown): boolean {
  return validateContractAddress(address).isValid;
}
