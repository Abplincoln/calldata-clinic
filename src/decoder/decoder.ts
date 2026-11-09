import { decodeFunctionData } from 'viem';
import { ERC20_MINIMAL_ABI } from '../abi/erc20';
import { validateCalldata } from './validation';
import type {
  DecodedCalldataResult,
  DecodedParameter,
  FunctionInputMeta,
  SupportedFunctionName,
} from '../types/decoder';

/**
 * Decodes raw transaction calldata for the five supported ERC-20 functions:
 * - transfer(address,uint256)
 * - approve(address,uint256)
 * - transferFrom(address,address,uint256)
 * - balanceOf(address)
 * - allowance(address,address)
 *
 * Uses viem's standard decodeFunctionData with a strict minimal ABI.
 * uint256 values are strictly maintained as BigInt.
 * Addresses are preserved with exact accuracy.
 *
 * Does not require any RPC connection.
 */
export function decodeCalldata(rawCalldata: unknown): DecodedCalldataResult {
  // Step 1: Strict input and format validation
  const validation = validateCalldata(rawCalldata);
  if (!validation.isValid) {
    return validation.failure;
  }

  const { calldata, fnMeta } = validation;

  // Step 2: Decode with viem's decodeFunctionData using explicit minimal ABI
  try {
    const decoded = decodeFunctionData({
      abi: ERC20_MINIMAL_ABI,
      data: calldata,
    });

    if (decoded.functionName !== fnMeta.name) {
      return {
        success: false,
        errorType: 'DECODE_ERROR',
        selector: fnMeta.selector,
        error: `Decoded function name (${decoded.functionName}) does not match expected selector function (${fnMeta.name}).`,
      };
    }

    const rawArgs = decoded.args as readonly unknown[] | undefined;

    if (!rawArgs || rawArgs.length !== fnMeta.inputs.length) {
      return {
        success: false,
        errorType: 'DECODE_ERROR',
        selector: fnMeta.selector,
        error: `Expected ${fnMeta.inputs.length} arguments for ${fnMeta.signature}, received ${rawArgs?.length ?? 0}.`,
      };
    }

    const parameters: DecodedParameter[] = fnMeta.inputs.map(
      (input: FunctionInputMeta, index: number): DecodedParameter => {
        const rawArg = rawArgs[index];

        if (input.type === 'uint256') {
          if (typeof rawArg !== 'bigint') {
            throw new TypeError(
              `Expected parameter '${input.name}' to be BigInt, received ${typeof rawArg}`
            );
          }

          return {
            name: input.name,
            type: 'uint256',
            value: rawArg,
            formattedValue: rawArg.toString(10),
          };
        }

        if (input.type === 'address') {
          if (typeof rawArg !== 'string') {
            throw new TypeError(
              `Expected parameter '${input.name}' to be address string, received ${typeof rawArg}`
            );
          }

          return {
            name: input.name,
            type: 'address',
            value: rawArg as `0x${string}`,
            formattedValue: rawArg,
          };
        }

        throw new Error(`Unsupported parameter type: ${input.type}`);
      }
    );

    return {
      success: true,
      functionName: fnMeta.name as SupportedFunctionName,
      signature: fnMeta.signature,
      selector: fnMeta.selector,
      parameters,
    };
  } catch (error) {
    return {
      success: false,
      errorType: 'DECODE_ERROR',
      selector: fnMeta.selector,
      error: error instanceof Error ? error.message : 'Unknown ABI decoding failure.',
    };
  }
}
