import { describe, it, expect } from 'vitest';
import { getTransactionByHash } from '../rpcService';

const isLive =
  typeof globalThis !== 'undefined' &&
  (globalThis as { process?: { env?: Record<string, string> } }).process?.env?.LIVE_RPC === 'true';

describe.runIf(isLive)('BOT Chain Live RPC Verification (Read-Only Live Query)', () => {
  // Verified real transaction hash from BOT Chain Bohr Testnet block 29836251
  const REAL_TX_HASH =
    '0x9b2dc0d502cd2464956e7019a75604973f7cff23312817f1c8590a0bef288b3a';

  it('successfully fetches and parses a real live transaction from https://rpc.bohr.life', async () => {
    const result = await getTransactionByHash(REAL_TX_HASH);

    console.log(
      'LIVE_RPC_RESULT:',
      JSON.stringify(result, (_key: string, value: unknown) => (typeof value === 'bigint' ? value.toString() : value), 2)
    );

    expect(result.success).toBe(true);
    if (!result.success) return;

    expect(result.transaction.hash.toLowerCase()).toBe(REAL_TX_HASH.toLowerCase());
    expect(result.transaction.from.toLowerCase()).toBe('0x68d8e693b31decc4625e7a03d0876711c3673dc0');
    expect(result.transaction.to?.toLowerCase()).toBe('0x0000000000000000000000000000000000001000');
    expect(result.transaction.blockNumber).toBeGreaterThan(0n);
    expect(result.transaction.gasLimit).toBeGreaterThan(0n);
    expect(result.transaction.explorerUrl).toBe(`https://scan.bohr.life/tx/${REAL_TX_HASH}`);

    // Verified calldata breakdown for deposit(address) selector 0xf340fa01
    expect(result.decodedCalldata).toBeDefined();
    expect(result.decodedCalldata?.success).toBe(false);
    if (result.decodedCalldata && !result.decodedCalldata.success) {
      expect(result.decodedCalldata.errorType).toBe('UNSUPPORTED_SELECTOR');
      expect(result.decodedCalldata.selector).toBe('0xf340fa01');
    }
  }, 15000);
});
