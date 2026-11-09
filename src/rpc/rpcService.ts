import { BOT_CHAIN_BOHR_TESTNET, buildExplorerTxUrl } from '../constants/botchain';
import { decodeCalldata } from '../decoder/decoder';
import { validateTransactionHash } from './validation';
import type {
  JsonRpcRequest,
  JsonRpcResponse,
  ParsedTransaction,
  RawRpcTransaction,
  RpcLookupResult,
} from '../types/rpc';

export interface RpcServiceOptions {
  rpcUrl?: string;
  timeoutMs?: number;
}

/**
 * Fetches transaction details from the BOT Chain Bohr Testnet via JSON-RPC eth_getTransactionByHash
 * using native fetch.
 *
 * Validates the transaction hash before dispatch, handles timeouts and network failures,
 * maintains numeric precision via BigInt, and passes transaction calldata into the decoder.
 */
export async function getTransactionByHash(
  rawTxHash: unknown,
  options?: RpcServiceOptions
): Promise<RpcLookupResult> {
  // Step 1: Validate transaction hash before dispatching request
  const validation = validateTransactionHash(rawTxHash);
  if (!validation.isValid || !validation.txHash) {
    return {
      success: false,
      errorType: 'INVALID_TX_HASH',
      txHash: typeof rawTxHash === 'string' ? rawTxHash : undefined,
      error: validation.error ?? 'Invalid transaction hash.',
    };
  }

  const txHash = validation.txHash;
  const rpcUrl = options?.rpcUrl ?? BOT_CHAIN_BOHR_TESTNET.rpcUrl;
  const timeoutMs = options?.timeoutMs ?? BOT_CHAIN_BOHR_TESTNET.defaultTimeoutMs;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  const payload: JsonRpcRequest = {
    jsonrpc: '2.0',
    id: 1,
    method: 'eth_getTransactionByHash',
    params: [txHash],
  };

  try {
    const response = await fetch(rpcUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    // Step 2: Handle HTTP response status
    if (!response.ok) {
      return {
        success: false,
        errorType: 'HTTP_ERROR',
        txHash,
        statusCode: response.status,
        error: `HTTP error ${response.status}: ${response.statusText || 'RPC server returned an error'}`,
      };
    }

    const data = (await response.json()) as JsonRpcResponse<RawRpcTransaction | null>;

    // Step 3: Handle JSON-RPC level errors
    if (data.error) {
      return {
        success: false,
        errorType: 'RPC_ERROR',
        txHash,
        rpcErrorCode: data.error.code,
        error: `RPC Error (${data.error.code}): ${data.error.message}`,
      };
    }

    // Step 4: Handle null transaction result (not found / pending / invalid)
    if (data.result === null || data.result === undefined) {
      return {
        success: false,
        errorType: 'TRANSACTION_NOT_FOUND',
        txHash,
        error: `Transaction not found on BOT Chain Bohr Testnet: ${txHash}. The transaction may be pending, dropped, or does not exist.`,
      };
    }

    const rawTx = data.result;

    // Step 5: Parse numeric values using BigInt (never convert large hex to JS Number)
    const valueWei = BigInt(rawTx.value);
    const blockNumber = rawTx.blockNumber ? BigInt(rawTx.blockNumber) : null;
    const gasLimit = BigInt(rawTx.gas);

    const isContractCreation = rawTx.to === null;
    const hasCalldata = rawTx.input !== '0x' && rawTx.input.length > 2;

    const parsedTx: ParsedTransaction = {
      hash: rawTx.hash,
      from: rawTx.from,
      to: rawTx.to,
      isContractCreation,
      contractCreationNote: isContractCreation
        ? "Contract creation transaction. The destination address ('to') is null. This MVP does not inspect contract deployment bytecode."
        : undefined,
      input: rawTx.input,
      hasCalldata,
      emptyCalldataNote: !hasCalldata
        ? 'No calldata is present (input is 0x).'
        : undefined,
      valueRaw: rawTx.value,
      valueWei,
      blockNumberRaw: rawTx.blockNumber,
      blockNumber,
      gasLimitRaw: rawTx.gas,
      gasLimit,
      explorerUrl: buildExplorerTxUrl(txHash),
      executionStatusNote:
        'Transaction details retrieved from BOT Chain Bohr Testnet. Note: eth_getTransactionByHash returns transaction parameters and does not confirm execution receipt or status.',
      raw: rawTx,
    };

    // Step 6: Decoder integration
    // If input is 0x, do not attempt to decode.
    // If input has calldata, pass into existing decoder.
    const decodedCalldata = hasCalldata ? decodeCalldata(rawTx.input) : undefined;

    return {
      success: true,
      transaction: parsedTx,
      decodedCalldata,
    };
  } catch (error: unknown) {
    clearTimeout(timeoutId);

    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        return {
          success: false,
          errorType: 'TIMEOUT_ERROR',
          txHash,
          error: `RPC request timed out after ${timeoutMs}ms while connecting to ${rpcUrl}.`,
        };
      }

      return {
        success: false,
        errorType: 'NETWORK_ERROR',
        txHash,
        error: `Network failure connecting to BOT Chain RPC: ${error.message}`,
      };
    }

    return {
      success: false,
      errorType: 'NETWORK_ERROR',
      txHash,
      error: 'An unknown network error occurred while querying the RPC.',
    };
  }
}
