import type { DecodedCalldataResult } from './decoder';

/**
 * Raw transaction object as returned directly by standard EVM JSON-RPC eth_getTransactionByHash.
 */
export interface RawRpcTransaction {
  hash: `0x${string}`;
  from: `0x${string}`;
  to: `0x${string}` | null;
  input: `0x${string}`;
  value: `0x${string}`;
  blockNumber: `0x${string}` | null;
  blockHash: `0x${string}` | null;
  gas: `0x${string}`;
  gasPrice?: `0x${string}`;
  maxFeePerGas?: `0x${string}`;
  maxPriorityFeePerGas?: `0x${string}`;
  nonce: `0x${string}`;
  transactionIndex: `0x${string}` | null;
  type?: `0x${string}`;
  chainId?: `0x${string}`;
}

/**
 * Cleanly parsed transaction representation preserving full numeric precision.
 * No conversion of large hex values to JavaScript Number is performed.
 */
export interface ParsedTransaction {
  hash: `0x${string}`;
  from: `0x${string}`;
  to: `0x${string}` | null;
  isContractCreation: boolean;
  contractCreationNote?: string;
  input: `0x${string}`;
  hasCalldata: boolean;
  emptyCalldataNote?: string;
  valueRaw: `0x${string}`;
  valueWei: bigint;
  blockNumberRaw: `0x${string}` | null;
  blockNumber: bigint | null;
  gasLimitRaw: `0x${string}`;
  gasLimit: bigint;
  explorerUrl: string;
  executionStatusNote: string;
  raw: RawRpcTransaction;
}

export type RpcErrorType =
  | 'INVALID_TX_HASH'
  | 'TRANSACTION_NOT_FOUND'
  | 'HTTP_ERROR'
  | 'RPC_ERROR'
  | 'NETWORK_ERROR'
  | 'TIMEOUT_ERROR';

export interface RpcLookupSuccess {
  success: true;
  transaction: ParsedTransaction;
  decodedCalldata?: DecodedCalldataResult;
}

export interface RpcLookupFailure {
  success: false;
  errorType: RpcErrorType;
  txHash?: string;
  statusCode?: number;
  rpcErrorCode?: number;
  error: string;
}

export type RpcLookupResult = RpcLookupSuccess | RpcLookupFailure;

export interface JsonRpcRequest {
  jsonrpc: '2.0';
  id: number;
  method: string;
  params: unknown[];
}

export interface JsonRpcResponse<T> {
  jsonrpc: '2.0';
  id: number;
  result?: T;
  error?: {
    code: number;
    message: string;
    data?: unknown;
  };
}
