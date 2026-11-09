import { describe, it, expect } from 'vitest';
import { encodeFunctionData } from 'viem';
import { decodeCalldata } from '../decoder';
import { ERC20_MINIMAL_ABI } from '../../abi/erc20';

describe('ERC-20 Calldata Decoder', () => {
  const TEST_ADDR_1 = '0x70997970C51812dc3A010C7d01b50e0d17dc79C8' as const;
  const TEST_ADDR_2 = '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC' as const;
  const TEST_ADDR_3 = '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266' as const;

  const MAX_UINT256 = 115792089237316195423570985008687907853269984665640564039457584007913129639935n;
  const ONE_ETHER = 1000000000000000000n; // 1 BOT = 10^18 wei

  describe('1. transfer(address,uint256)', () => {
    it('decodes canonical transfer calldata correctly', () => {
      // Known raw hex for transfer(0x70997970C51812dc3A010C7d01b50e0d17dc79C8, 1000000000000000000)
      const rawCalldata =
        '0xa9059cbb00000000000000000000000070997970c51812dc3a010c7d01b50e0d17dc79c80000000000000000000000000000000000000000000000000de0b6b3a7640000';

      const result = decodeCalldata(rawCalldata);

      expect(result.success).toBe(true);
      if (!result.success) return;

      expect(result.functionName).toBe('transfer');
      expect(result.signature).toBe('transfer(address,uint256)');
      expect(result.selector).toBe('0xa9059cbb');
      expect(result.parameters).toHaveLength(2);

      // Parameter 1: recipient (address)
      expect(result.parameters[0].name).toBe('recipient');
      expect(result.parameters[0].type).toBe('address');
      expect(String(result.parameters[0].value).toLowerCase()).toBe(TEST_ADDR_1.toLowerCase());

      // Parameter 2: amount (uint256)
      expect(result.parameters[1].name).toBe('amount');
      expect(result.parameters[1].type).toBe('uint256');
      expect(result.parameters[1].value).toBe(ONE_ETHER);
      expect(typeof result.parameters[1].value).toBe('bigint');
      expect(result.parameters[1].formattedValue).toBe('1000000000000000000');
    });

    it('matches viem encoded transfer calldata', () => {
      const viemCalldata = encodeFunctionData({
        abi: ERC20_MINIMAL_ABI,
        functionName: 'transfer',
        args: [TEST_ADDR_1, 5000000000000000000n],
      });

      const result = decodeCalldata(viemCalldata);
      expect(result.success).toBe(true);
      if (!result.success) return;

      expect(result.functionName).toBe('transfer');
      expect(result.parameters[1].value).toBe(5000000000000000000n);
    });
  });

  describe('2. approve(address,uint256)', () => {
    it('decodes approve with max uint256 correctly without precision loss', () => {
      // approve(0x70997970C51812dc3A010C7d01b50e0d17dc79C8, 2^256 - 1)
      const rawCalldata =
        '0x095ea7b300000000000000000000000070997970c51812dc3a010c7d01b50e0d17dc79c8ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff';

      const result = decodeCalldata(rawCalldata);

      expect(result.success).toBe(true);
      if (!result.success) return;

      expect(result.functionName).toBe('approve');
      expect(result.signature).toBe('approve(address,uint256)');
      expect(result.selector).toBe('0x095ea7b3');
      expect(result.parameters).toHaveLength(2);

      expect(result.parameters[0].name).toBe('spender');
      expect(result.parameters[0].type).toBe('address');
      expect(String(result.parameters[0].value).toLowerCase()).toBe(TEST_ADDR_1.toLowerCase());

      expect(result.parameters[1].name).toBe('amount');
      expect(result.parameters[1].type).toBe('uint256');
      expect(result.parameters[1].value).toBe(MAX_UINT256);
      expect(typeof result.parameters[1].value).toBe('bigint');
      expect(result.parameters[1].formattedValue).toBe(
        '115792089237316195423570985008687907853269984665640564039457584007913129639935'
      );
    });
  });

  describe('3. transferFrom(address,address,uint256)', () => {
    it('decodes transferFrom preserving parameter ordering and 3 arguments', () => {
      const rawCalldata = encodeFunctionData({
        abi: ERC20_MINIMAL_ABI,
        functionName: 'transferFrom',
        args: [TEST_ADDR_1, TEST_ADDR_2, 750000000000000000n],
      });

      const result = decodeCalldata(rawCalldata);

      expect(result.success).toBe(true);
      if (!result.success) return;

      expect(result.functionName).toBe('transferFrom');
      expect(result.signature).toBe('transferFrom(address,address,uint256)');
      expect(result.selector).toBe('0x23b872dd');
      expect(result.parameters).toHaveLength(3);

      // Arg 0: sender
      expect(result.parameters[0].name).toBe('sender');
      expect(result.parameters[0].type).toBe('address');
      expect(String(result.parameters[0].value).toLowerCase()).toBe(TEST_ADDR_1.toLowerCase());

      // Arg 1: recipient
      expect(result.parameters[1].name).toBe('recipient');
      expect(result.parameters[1].type).toBe('address');
      expect(String(result.parameters[1].value).toLowerCase()).toBe(TEST_ADDR_2.toLowerCase());

      // Arg 2: amount
      expect(result.parameters[2].name).toBe('amount');
      expect(result.parameters[2].type).toBe('uint256');
      expect(result.parameters[2].value).toBe(750000000000000000n);
    });
  });

  describe('4. balanceOf(address)', () => {
    it('decodes balanceOf single address parameter correctly', () => {
      const rawCalldata =
        '0x70a08231000000000000000000000000f39fd6e51aad88f6f4ce6ab8827279cfffb92266';

      const result = decodeCalldata(rawCalldata);

      expect(result.success).toBe(true);
      if (!result.success) return;

      expect(result.functionName).toBe('balanceOf');
      expect(result.signature).toBe('balanceOf(address)');
      expect(result.selector).toBe('0x70a08231');
      expect(result.parameters).toHaveLength(1);

      expect(result.parameters[0].name).toBe('account');
      expect(result.parameters[0].type).toBe('address');
      expect(String(result.parameters[0].value).toLowerCase()).toBe(TEST_ADDR_3.toLowerCase());
    });
  });

  describe('5. allowance(address,address)', () => {
    it('decodes allowance two address parameters correctly', () => {
      const rawCalldata =
        '0xdd62ed3e000000000000000000000000f39fd6e51aad88f6f4ce6ab8827279cfffb9226600000000000000000000000070997970c51812dc3a010c7d01b50e0d17dc79c8';

      const result = decodeCalldata(rawCalldata);

      expect(result.success).toBe(true);
      if (!result.success) return;

      expect(result.functionName).toBe('allowance');
      expect(result.signature).toBe('allowance(address,address)');
      expect(result.selector).toBe('0xdd62ed3e');
      expect(result.parameters).toHaveLength(2);

      expect(result.parameters[0].name).toBe('owner');
      expect(result.parameters[0].type).toBe('address');
      expect(String(result.parameters[0].value).toLowerCase()).toBe(TEST_ADDR_3.toLowerCase());

      expect(result.parameters[1].name).toBe('spender');
      expect(result.parameters[1].type).toBe('address');
      expect(String(result.parameters[1].value).toLowerCase()).toBe(TEST_ADDR_1.toLowerCase());
    });
  });

  describe('Validation & Error Handling', () => {
    it('rejects missing or empty calldata', () => {
      expect(decodeCalldata(null)).toEqual({
        success: false,
        errorType: 'MISSING_CALLDATA',
        error: 'Calldata is missing or undefined.',
      });

      expect(decodeCalldata(undefined)).toEqual({
        success: false,
        errorType: 'MISSING_CALLDATA',
        error: 'Calldata is missing or undefined.',
      });

      expect(decodeCalldata('')).toEqual({
        success: false,
        errorType: 'MISSING_CALLDATA',
        error: 'Calldata is empty.',
      });

      expect(decodeCalldata('   ')).toEqual({
        success: false,
        errorType: 'MISSING_CALLDATA',
        error: 'Calldata is empty.',
      });
    });

    it('rejects calldata missing 0x prefix without silently repairing', () => {
      const raw =
        'a9059cbb00000000000000000000000070997970c51812dc3a010c7d01b50e0d17dc79c80000000000000000000000000000000000000000000000000de0b6b3a7640000';
      const result = decodeCalldata(raw);

      expect(result.success).toBe(false);
      if (result.success) return;
      expect(result.errorType).toBe('MISSING_PREFIX');
      expect(result.error).toContain("must begin with a '0x' prefix");
    });

    it('rejects calldata containing invalid hexadecimal characters', () => {
      const invalid =
        '0xa9059cbbZZZZZZZZ000000000000000070997970c51812dc3a010c7d01b50e0d17dc79c80000000000000000000000000000000000000000000000000de0b6b3a7640000';
      const result = decodeCalldata(invalid);

      expect(result.success).toBe(false);
      if (result.success) return;
      expect(result.errorType).toBe('INVALID_HEX');
      expect(result.error).toContain('invalid hexadecimal characters');
    });

    it('rejects odd-length hexadecimal calldata', () => {
      const odd = '0xa9059cbb1';
      const result = decodeCalldata(odd);

      expect(result.success).toBe(false);
      if (result.success) return;
      expect(result.errorType).toBe('ODD_LENGTH');
      expect(result.error).toContain('odd hexadecimal length');
    });

    it('rejects calldata shorter than a 4-byte selector', () => {
      expect(decodeCalldata('0x')).toEqual({
        success: false,
        errorType: 'TOO_SHORT',
        error: 'Calldata is too short (0 bytes). A function selector requires at least 4 bytes (8 hex characters).',
      });

      expect(decodeCalldata('0xa9')).toEqual({
        success: false,
        errorType: 'TOO_SHORT',
        error: 'Calldata is too short (1 byte). A function selector requires at least 4 bytes (8 hex characters).',
      });

      expect(decodeCalldata('0xa9059c')).toEqual({
        success: false,
        errorType: 'TOO_SHORT',
        error: 'Calldata is too short (3 bytes). A function selector requires at least 4 bytes (8 hex characters).',
      });
    });

    it('rejects unsupported function selectors clearly without guessing', () => {
      // 0x12345678 is not in the 5 supported ERC-20 methods
      const unknownSelector =
        '0x1234567800000000000000000000000070997970c51812dc3a010c7d01b50e0d17dc79c80000000000000000000000000000000000000000000000000de0b6b3a7640000';
      const result = decodeCalldata(unknownSelector);

      expect(result.success).toBe(false);
      if (result.success) return;
      expect(result.errorType).toBe('UNSUPPORTED_SELECTOR');
      expect(result.selector).toBe('0x12345678');
      expect(result.error).toContain('Unsupported function selector: 0x12345678');
      expect(result.error).toContain('transfer(address,uint256)');
    });

    it('rejects incomplete parameter data for supported function', () => {
      // transfer selector followed by only 20 bytes (instead of expected 64 bytes)
      const incomplete =
        '0xa9059cbb70997970c51812dc3a010c7d01b50e0d17dc79c8';
      const result = decodeCalldata(incomplete);

      expect(result.success).toBe(false);
      if (result.success) return;
      expect(result.errorType).toBe('INCOMPLETE_DATA');
      expect(result.selector).toBe('0xa9059cbb');
      expect(result.error).toContain('Incomplete parameter data');
    });

    it('rejects incorrect parameter length (too long) for supported function', () => {
      // transfer selector with 3 words (96 bytes) instead of 2 words (64 bytes)
      const tooLong =
        '0xa9059cbb00000000000000000000000070997970c51812dc3a010c7d01b50e0d17dc79c80000000000000000000000000000000000000000000000000de0b6b3a76400000000000000000000000000000000000000000000000000000000000000000001';
      const result = decodeCalldata(tooLong);

      expect(result.success).toBe(false);
      if (result.success) return;
      expect(result.errorType).toBe('INCORRECT_LENGTH');
      expect(result.selector).toBe('0xa9059cbb');
      expect(result.error).toContain('Incorrect parameter length');
    });
  });
});
