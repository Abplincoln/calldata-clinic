import { describe, it, expect, vi } from 'vitest';
import { CALLDATA_PRESETS } from '../../constants/presets';
import { decodeCalldata } from '../../decoder/decoder';
import { validateContractAddress } from '../../decoder/addressValidator';
import { getTransactionByHash } from '../../rpc/rpcService';
import { buildExplorerTxUrl, BOT_CHAIN_BOHR_TESTNET } from '../../constants/botchain';

describe('Stage 4: Frontend Integration & Presets Verification', () => {
  describe('1. Five Presets Validation (Raw uint256 amounts without token unit assumptions)', () => {
    it('verifies all 5 presets exist with raw descriptions', () => {
      expect(CALLDATA_PRESETS).toHaveLength(5);
      const ids = CALLDATA_PRESETS.map((p) => p.id);
      expect(ids).toEqual(['transfer', 'approve', 'transferFrom', 'balanceOf', 'allowance']);

      // Ensure no presets assume token names or decimals like "1 BOT" or "0.5 BOT"
      for (const preset of CALLDATA_PRESETS) {
        expect(preset.description).not.toContain('BOT');
      }
    });

    it('decodes preset 1: transfer successfully', () => {
      const preset = CALLDATA_PRESETS.find((p) => p.id === 'transfer');
      expect(preset).toBeDefined();
      const res = decodeCalldata(preset!.calldata);
      expect(res.success).toBe(true);
      if (res.success) {
        expect(res.functionName).toBe('transfer');
        expect(res.signature).toBe('transfer(address,uint256)');
        expect(res.parameters).toHaveLength(2);
        expect(res.parameters[0].name).toBe('recipient');
        expect(res.parameters[1].name).toBe('amount');
        expect(res.parameters[1].value).toBe(1000000000000000000n);
      }
    });

    it('decodes preset 2: approve with max uint256 successfully', () => {
      const preset = CALLDATA_PRESETS.find((p) => p.id === 'approve');
      expect(preset).toBeDefined();
      const res = decodeCalldata(preset!.calldata);
      expect(res.success).toBe(true);
      if (res.success) {
        expect(res.functionName).toBe('approve');
        expect(res.signature).toBe('approve(address,uint256)');
        expect(res.parameters[1].value).toBe(
          115792089237316195423570985008687907853269984665640564039457584007913129639935n
        );
      }
    });

    it('decodes preset 3: transferFrom successfully', () => {
      const preset = CALLDATA_PRESETS.find((p) => p.id === 'transferFrom');
      expect(preset).toBeDefined();
      const res = decodeCalldata(preset!.calldata);
      expect(res.success).toBe(true);
      if (res.success) {
        expect(res.functionName).toBe('transferFrom');
        expect(res.signature).toBe('transferFrom(address,address,uint256)');
        expect(res.parameters).toHaveLength(3);
        expect(res.parameters[0].name).toBe('sender');
        expect(res.parameters[1].name).toBe('recipient');
        expect(res.parameters[2].name).toBe('amount');
      }
    });

    it('decodes preset 4: balanceOf successfully', () => {
      const preset = CALLDATA_PRESETS.find((p) => p.id === 'balanceOf');
      expect(preset).toBeDefined();
      const res = decodeCalldata(preset!.calldata);
      expect(res.success).toBe(true);
      if (res.success) {
        expect(res.functionName).toBe('balanceOf');
        expect(res.signature).toBe('balanceOf(address)');
        expect(res.parameters).toHaveLength(1);
        expect(res.parameters[0].name).toBe('account');
      }
    });

    it('decodes preset 5: allowance successfully', () => {
      const preset = CALLDATA_PRESETS.find((p) => p.id === 'allowance');
      expect(preset).toBeDefined();
      const res = decodeCalldata(preset!.calldata);
      expect(res.success).toBe(true);
      if (res.success) {
        expect(res.functionName).toBe('allowance');
        expect(res.signature).toBe('allowance(address,address)');
        expect(res.parameters).toHaveLength(2);
        expect(res.parameters[0].name).toBe('owner');
        expect(res.parameters[1].name).toBe('spender');
      }
    });
  });

  describe('2. Malformed Calldata and Unsupported Selectors', () => {
    it('rejects malformed inputs cleanly', () => {
      expect(decodeCalldata('0x12').success).toBe(false);
      expect(decodeCalldata('0xZZZZ').success).toBe(false);
      expect(decodeCalldata('0xa9059cbb1').success).toBe(false);
      expect(decodeCalldata('a9059cbb').success).toBe(false);
    });

    it('returns unsupported selector result with selector preservation', () => {
      const res = decodeCalldata('0x112233440000000000000000000000001111111111111111111111111111111111111111');
      expect(res.success).toBe(false);
      if (!res.success) {
        expect(res.errorType).toBe('UNSUPPORTED_SELECTOR');
        expect(res.selector).toBe('0x11223344');
      }
    });
  });

  describe('3. Transaction Lookup Integration & Pending State Handling', () => {
    it('builds explorer URLs correctly', () => {
      const txHash = '0x9b2dc0d502cd2464956e7019a75604973f7cff23312817f1c8590a0bef288b3a';
      expect(buildExplorerTxUrl(txHash)).toBe(`https://scan.bohr.life/tx/${txHash}`);
    });

    it('handles empty calldata (0x) stating only that no calldata is present', async () => {
      vi.stubGlobal(
        'fetch',
        vi.fn().mockResolvedValue({
          ok: true,
          json: async () => ({
            jsonrpc: '2.0',
            id: 1,
            result: {
              hash: '0x9b2dc0d502cd2464956e7019a75604973f7cff23312817f1c8590a0bef288b3a',
              from: '0x68d8e693b31decc4625e7a03d0876711c3673dc0',
              to: '0x0000000000000000000000000000000000001000',
              input: '0x',
              value: '0x10',
              blockNumber: '0x100',
              gas: '0x5208',
              nonce: '0x1',
            },
          }),
        })
      );

      const res = await getTransactionByHash('0x9b2dc0d502cd2464956e7019a75604973f7cff23312817f1c8590a0bef288b3a');
      expect(res.success).toBe(true);
      if (res.success) {
        expect(res.transaction.hasCalldata).toBe(false);
        expect(res.transaction.emptyCalldataNote).toBe('No calldata is present (input is 0x).');
      }
    });

    it('handles pending transactions where blockNumber is null without crashing', async () => {
      vi.stubGlobal(
        'fetch',
        vi.fn().mockResolvedValue({
          ok: true,
          json: async () => ({
            jsonrpc: '2.0',
            id: 1,
            result: {
              hash: '0x9b2dc0d502cd2464956e7019a75604973f7cff23312817f1c8590a0bef288b3a',
              from: '0x68d8e693b31decc4625e7a03d0876711c3673dc0',
              to: '0x0000000000000000000000000000000000001000',
              input: '0x',
              value: '0x0',
              blockNumber: null,
              gas: '0x5208',
              nonce: '0x2',
            },
          }),
        })
      );

      const res = await getTransactionByHash('0x9b2dc0d502cd2464956e7019a75604973f7cff23312817f1c8590a0bef288b3a');
      expect(res.success).toBe(true);
      if (res.success) {
        expect(res.transaction.blockNumber).toBeNull();
        expect(res.transaction.blockNumberRaw).toBeNull();
      }
    });
  });

  describe('4. Contract Address Validation', () => {
    it('validates checksummed and unchecksummed addresses correctly', () => {
      const valid = '0x70997970C51812dc3A010C7d01b50e0d17dc79C8';
      const res = validateContractAddress(valid);
      expect(res.isValid).toBe(true);
      expect(res.isChecksummed).toBe(true);

      const invalid = '0x70997970c51812dc3A010C7d01b50e0d17dc79C8';
      const resBad = validateContractAddress(invalid);
      expect(resBad.isValid).toBe(false);
    });
  });

  describe('5. BOT Chain Branding Constants', () => {
    it('verifies BOT Chain configuration constants', () => {
      expect(BOT_CHAIN_BOHR_TESTNET.chainId).toBe(968);
      expect(BOT_CHAIN_BOHR_TESTNET.rpcUrl).toBe('https://rpc.bohr.life');
      expect(BOT_CHAIN_BOHR_TESTNET.explorerUrl).toBe('https://scan.bohr.life');
      expect(BOT_CHAIN_BOHR_TESTNET.nativeTokenSymbol).toBe('BOT');
    });
  });
});
