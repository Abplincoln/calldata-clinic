import { describe, it, expect } from 'vitest';
import {
  validateContractAddress,
  isValidContractAddress,
} from '../addressValidator';

describe('Contract Address Validator', () => {
  const VALID_CHECKSUMMED = '0x70997970C51812dc3A010C7d01b50e0d17dc79C8';
  const VALID_LOWERCASE = '0x70997970c51812dc3a010c7d01b50e0d17dc79c8';
  const VALID_UPPERCASE = '0X70997970C51812DC3A010C7D01B50E0D17DC79C8';

  it('validates correctly formatted checksummed address', () => {
    const res = validateContractAddress(VALID_CHECKSUMMED);
    expect(res.isValid).toBe(true);
    expect(res.address).toBe(VALID_CHECKSUMMED);
    expect(res.checksummedAddress).toBe(VALID_CHECKSUMMED);
    expect(res.isChecksummed).toBe(true);
    expect(isValidContractAddress(VALID_CHECKSUMMED)).toBe(true);
  });

  it('validates lowercase address and returns its checksummed equivalent', () => {
    const res = validateContractAddress(VALID_LOWERCASE);
    expect(res.isValid).toBe(true);
    expect(res.checksummedAddress).toBe(VALID_CHECKSUMMED);
    expect(res.isChecksummed).toBe(false); // was not mixed-case checksummed
  });

  it('validates uppercase address and returns its checksummed equivalent', () => {
    const res = validateContractAddress(VALID_UPPERCASE);
    expect(res.isValid).toBe(true);
    expect(res.checksummedAddress).toBe(VALID_CHECKSUMMED);
  });

  it('rejects corrupt mixed-case address with invalid EIP-55 checksum', () => {
    // Modify one letter casing in VALID_CHECKSUMMED (change C to c)
    const corruptChecksum = '0x70997970c51812dc3A010C7d01b50e0d17dc79C8';
    const res = validateContractAddress(corruptChecksum);
    expect(res.isValid).toBe(false);
    expect(res.error).toContain('invalid EIP-55 checksum');
    expect(isValidContractAddress(corruptChecksum)).toBe(false);
  });

  it('rejects address without 0x prefix', () => {
    const noPrefix = '70997970C51812dc3A010C7d01b50e0d17dc79C8';
    const res = validateContractAddress(noPrefix);
    expect(res.isValid).toBe(false);
    expect(res.error).toContain("must begin with a '0x' prefix");
  });

  it('rejects address with incorrect length', () => {
    const tooShort = '0x70997970C51812dc3A010C7d01b50e0d17dc79C'; // 41 chars
    const res1 = validateContractAddress(tooShort);
    expect(res1.isValid).toBe(false);
    expect(res1.error).toContain('exactly 42 characters');

    const tooLong = '0x70997970C51812dc3A010C7d01b50e0d17dc79C800'; // 44 chars
    const res2 = validateContractAddress(tooLong);
    expect(res2.isValid).toBe(false);
    expect(res2.error).toContain('exactly 42 characters');
  });

  it('rejects address with invalid non-hex characters', () => {
    const invalidChars = '0x70997970C51812dc3A010C7d01b50e0d17dc79ZZ';
    const res = validateContractAddress(invalidChars);
    expect(res.isValid).toBe(false);
    expect(res.error).toContain('invalid hexadecimal characters');
  });

  it('rejects missing or empty address', () => {
    expect(validateContractAddress(null).isValid).toBe(false);
    expect(validateContractAddress(undefined).isValid).toBe(false);
    expect(validateContractAddress('').isValid).toBe(false);
    expect(validateContractAddress('   ').isValid).toBe(false);
  });
});
