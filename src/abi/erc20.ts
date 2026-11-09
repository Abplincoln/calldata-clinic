import { parseAbi } from 'viem';
import type {
  SupportedFunctionName,
  FunctionMeta,
} from '../types/decoder';

/**
 * Explicit minimal ERC-20 ABI containing strictly the five required functions.
 */
export const ERC20_MINIMAL_ABI = parseAbi([
  'function transfer(address recipient, uint256 amount) returns (bool)',
  'function approve(address spender, uint256 amount) returns (bool)',
  'function transferFrom(address sender, address recipient, uint256 amount) returns (bool)',
  'function balanceOf(address account) view returns (uint256)',
  'function allowance(address owner, address spender) view returns (uint256)',
] as const);

export const SUPPORTED_FUNCTIONS: Record<SupportedFunctionName, FunctionMeta> = {
  transfer: {
    name: 'transfer',
    signature: 'transfer(address,uint256)',
    selector: '0xa9059cbb',
    inputs: [
      { name: 'recipient', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    expectedParamCount: 2,
    expectedByteLength: 68,
  },
  approve: {
    name: 'approve',
    signature: 'approve(address,uint256)',
    selector: '0x095ea7b3',
    inputs: [
      { name: 'spender', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    expectedParamCount: 2,
    expectedByteLength: 68,
  },
  transferFrom: {
    name: 'transferFrom',
    signature: 'transferFrom(address,address,uint256)',
    selector: '0x23b872dd',
    inputs: [
      { name: 'sender', type: 'address' },
      { name: 'recipient', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    expectedParamCount: 3,
    expectedByteLength: 100,
  },
  balanceOf: {
    name: 'balanceOf',
    signature: 'balanceOf(address)',
    selector: '0x70a08231',
    inputs: [{ name: 'account', type: 'address' }],
    expectedParamCount: 1,
    expectedByteLength: 36,
  },
  allowance: {
    name: 'allowance',
    signature: 'allowance(address,address)',
    selector: '0xdd62ed3e',
    inputs: [
      { name: 'owner', type: 'address' },
      { name: 'spender', type: 'address' },
    ],
    expectedParamCount: 2,
    expectedByteLength: 68,
  },
};

export const SUPPORTED_SELECTORS: Record<string, FunctionMeta> = Object.values(
  SUPPORTED_FUNCTIONS
).reduce<Record<string, FunctionMeta>>((acc, fn) => {
  acc[fn.selector.toLowerCase()] = fn;
  return acc;
}, {});
