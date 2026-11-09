import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { getTransactionByHash } from '../rpcService';
import { buildExplorerTxUrl } from '../../constants/botchain';
import type { RawRpcTransaction } from '../../types/rpc';

describe('BOT Chain RPC Service (eth_getTransactionByHash)', () => {
  const VALID_TX_HASH =
    '0x9b2dc0d502cd2464956e7019a75604973f7cff23312817f1c8590a0bef288b3a' as const;
  const SENDER_ADDR = '0x70997970C51812dc3A010C7d01b50e0d17dc79C8';

  // Canonical transfer(recipient, 10^18) calldata
  const TRANSFER_CALLDATA =
    '0xa9059cbb0000000000000000000000003c44cdddb6a900fa2b585dd299e03d12fa4293bc0000000000000000000000000000000000000000000000000de0b6b3a7640000';

  // Canonical approve(spender, 2^256 - 1) calldata
  const APPROVE_MAX_CALLDATA =
    '0x095ea7b30000000000000000000000003c44cdddb6a900fa2b585dd299e03d12fa4293bcffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff';

  // Unsupported selector 0x12345678
  const UNSUPPORTED_CALLDATA =
    '0x123456780000000000000000000000003c44cdddb6a900fa2b585dd299e03d12fa4293bc0000000000000000000000000000000000000000000000000de0b6b3a7640000';

  const mockRpcTx: RawRpcTransaction = {
    hash: VALID_TX_HASH,
    from: SENDER_ADDR,
    to: '0xaBabc7Ddc03e501d190C676BF3d92ef0e6e87a3C',
    input: TRANSFER_CALLDATA,
    value: '0x0',
    blockNumber: '0x1c743db',
    blockHash: '0x2c0c75d9d9367f3c93866a01c4df26dbf41c7fb009415f2bcd31a0eb090510bc',
    gas: '0x7fffffffffffffff', // Extremely large gas exceeding MAX_SAFE_INTEGER
    nonce: '0x1',
    transactionIndex: '0x0',
  };

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('1. performs successful transaction lookup and decodes transfer calldata', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          jsonrpc: '2.0',
          id: 1,
          result: mockRpcTx,
        }),
      })
    );

    const result = await getTransactionByHash(VALID_TX_HASH);

    expect(result.success).toBe(true);
    if (!result.success) return;

    expect(result.transaction.hash).toBe(VALID_TX_HASH);
    expect(result.transaction.from).toBe(SENDER_ADDR);
    expect(result.transaction.to).toBe('0xaBabc7Ddc03e501d190C676BF3d92ef0e6e87a3C');
    expect(result.transaction.isContractCreation).toBe(false);
    expect(result.transaction.hasCalldata).toBe(true);
    expect(result.transaction.explorerUrl).toBe(`https://scan.bohr.life/tx/${VALID_TX_HASH}`);

    // Verify BigInt handling for large gas
    expect(typeof result.transaction.gasLimit).toBe('bigint');
    expect(result.transaction.gasLimit).toBe(9223372036854775807n);
    expect(result.transaction.gasLimitRaw).toBe('0x7fffffffffffffff');

    // Verify Block number BigInt
    expect(result.transaction.blockNumber).toBe(BigInt('0x1c743db'));
    expect(result.transaction.blockNumberRaw).toBe('0x1c743db');

    // Verify execution status note
    expect(result.transaction.executionStatusNote).toContain(
      'eth_getTransactionByHash returns transaction parameters and does not confirm execution receipt or status'
    );

    // Verify decoded calldata
    expect(result.decodedCalldata).toBeDefined();
    expect(result.decodedCalldata?.success).toBe(true);
    if (result.decodedCalldata?.success) {
      expect(result.decodedCalldata.functionName).toBe('transfer');
      expect(result.decodedCalldata.signature).toBe('transfer(address,uint256)');
      expect(result.decodedCalldata.parameters).toHaveLength(2);
      expect(result.decodedCalldata.parameters[1].value).toBe(1000000000000000000n);
    }
  });

  it('2. successfully decodes an approve transaction with max uint256', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          jsonrpc: '2.0',
          id: 1,
          result: {
            ...mockRpcTx,
            input: APPROVE_MAX_CALLDATA,
          },
        }),
      })
    );

    const result = await getTransactionByHash(VALID_TX_HASH);

    expect(result.success).toBe(true);
    if (!result.success) return;

    expect(result.decodedCalldata?.success).toBe(true);
    if (result.decodedCalldata?.success) {
      expect(result.decodedCalldata.functionName).toBe('approve');
      expect(result.decodedCalldata.parameters[1].value).toBe(
        115792089237316195423570985008687907853269984665640564039457584007913129639935n
      );
    }
  });

  it('3. handles unsupported transaction calldata gracefully', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          jsonrpc: '2.0',
          id: 1,
          result: {
            ...mockRpcTx,
            input: UNSUPPORTED_CALLDATA,
          },
        }),
      })
    );

    const result = await getTransactionByHash(VALID_TX_HASH);

    expect(result.success).toBe(true);
    if (!result.success) return;

    // Raw input is preserved
    expect(result.transaction.input).toBe(UNSUPPORTED_CALLDATA);
    expect(result.decodedCalldata).toBeDefined();
    expect(result.decodedCalldata?.success).toBe(false);
    if (result.decodedCalldata && !result.decodedCalldata.success) {
      expect(result.decodedCalldata.errorType).toBe('UNSUPPORTED_SELECTOR');
      expect(result.decodedCalldata.selector).toBe('0x12345678');
      expect(result.decodedCalldata.error).toContain('Unsupported function selector: 0x12345678');
    }
  });

  it('4. handles transaction with empty input (0x) as native transfer without decoding', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          jsonrpc: '2.0',
          id: 1,
          result: {
            ...mockRpcTx,
            input: '0x',
            value: '0xde0b6b3a7640000', // 1 BOT
          },
        }),
      })
    );

    const result = await getTransactionByHash(VALID_TX_HASH);

    expect(result.success).toBe(true);
    if (!result.success) return;

    expect(result.transaction.hasCalldata).toBe(false);
    expect(result.transaction.emptyCalldataNote).toContain('No calldata is present');
    expect(result.decodedCalldata).toBeUndefined();
    expect(result.transaction.valueWei).toBe(1000000000000000000n);
  });

  it('5. identifies contract creation transactions with null destination', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          jsonrpc: '2.0',
          id: 1,
          result: {
            ...mockRpcTx,
            to: null,
            input: '0x608060405234801561001057600080fd5b50', // Bytecode
          },
        }),
      })
    );

    const result = await getTransactionByHash(VALID_TX_HASH);

    expect(result.success).toBe(true);
    if (!result.success) return;

    expect(result.transaction.to).toBeNull();
    expect(result.transaction.isContractCreation).toBe(true);
    expect(result.transaction.contractCreationNote).toContain(
      "Contract creation transaction. The destination address ('to') is null"
    );
  });

  it('6. handles null transaction result (transaction not found)', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          jsonrpc: '2.0',
          id: 1,
          result: null,
        }),
      })
    );

    const result = await getTransactionByHash(VALID_TX_HASH);

    expect(result.success).toBe(false);
    if (result.success) return;

    expect(result.errorType).toBe('TRANSACTION_NOT_FOUND');
    expect(result.error).toContain('Transaction not found on BOT Chain Bohr Testnet');
  });

  it('7. validates and rejects invalid transaction hash without sending fetch request', async () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal('fetch', fetchSpy);

    const invalidShort = '0x1234';
    const result = await getTransactionByHash(invalidShort);

    expect(fetchSpy).not.toHaveBeenCalled();
    expect(result.success).toBe(false);
    if (result.success) return;

    expect(result.errorType).toBe('INVALID_TX_HASH');
    expect(result.error).toContain('must be exactly 66 characters');
  });

  it('8. rejects non-hex or malformed transaction hashes', async () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal('fetch', fetchSpy);

    const nonHex =
      '0x9b2dc0d502cd2464956e7019a75604973f7cff23312817f1c8590a0bef288bZZ';
    const result = await getTransactionByHash(nonHex);

    expect(fetchSpy).not.toHaveBeenCalled();
    expect(result.success).toBe(false);
    if (result.success) return;

    expect(result.errorType).toBe('INVALID_TX_HASH');
    expect(result.error).toContain('invalid hexadecimal characters');
  });

  it('9. handles JSON-RPC error responses', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          jsonrpc: '2.0',
          id: 1,
          error: {
            code: -32602,
            message: 'Invalid params',
          },
        }),
      })
    );

    const result = await getTransactionByHash(VALID_TX_HASH);

    expect(result.success).toBe(false);
    if (result.success) return;

    expect(result.errorType).toBe('RPC_ERROR');
    expect(result.rpcErrorCode).toBe(-32602);
    expect(result.error).toContain('RPC Error (-32602): Invalid params');
  });

  it('10. handles HTTP error responses (e.g. 500)', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      })
    );

    const result = await getTransactionByHash(VALID_TX_HASH);

    expect(result.success).toBe(false);
    if (result.success) return;

    expect(result.errorType).toBe('HTTP_ERROR');
    expect(result.statusCode).toBe(500);
    expect(result.error).toContain('HTTP error 500');
  });

  it('11. handles network failures (e.g. connection refused)', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockRejectedValue(new TypeError('Failed to fetch'))
    );

    const result = await getTransactionByHash(VALID_TX_HASH);

    expect(result.success).toBe(false);
    if (result.success) return;

    expect(result.errorType).toBe('NETWORK_ERROR');
    expect(result.error).toContain('Network failure connecting to BOT Chain RPC');
  });

  it('12. handles request timeouts', async () => {
    const abortError = new Error('The operation was aborted');
    abortError.name = 'AbortError';

    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(abortError));

    const result = await getTransactionByHash(VALID_TX_HASH, { timeoutMs: 100 });

    expect(result.success).toBe(false);
    if (result.success) return;

    expect(result.errorType).toBe('TIMEOUT_ERROR');
    expect(result.error).toContain('RPC request timed out');
  });

  it('13. generates explorer link only for valid transaction hashes', () => {
    const validUrl = buildExplorerTxUrl(VALID_TX_HASH);
    expect(validUrl).toBe(`https://scan.bohr.life/tx/${VALID_TX_HASH}`);

    expect(() => buildExplorerTxUrl('0x123')).toThrow('Cannot build explorer link for invalid transaction hash');
    expect(() => buildExplorerTxUrl('')).toThrow('Cannot build explorer link for invalid transaction hash');
  });
});
