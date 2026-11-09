import { SUPPORTED_SELECTORS } from '../abi/erc20';
import type { DecodedCalldataFailure, FunctionMeta } from '../types/decoder';

export interface CalldataValidationSuccess {
  isValid: true;
  calldata: `0x${string}`;
  selector: `0x${string}`;
  fnMeta: FunctionMeta;
}

export type CalldataValidationResult =
  | CalldataValidationSuccess
  | { isValid: false; failure: DecodedCalldataFailure };

/**
 * Validates raw calldata according to EVM and Calldata Clinic rules.
 * Does not silently repair malformed data.
 */
export function validateCalldata(rawCalldata: unknown): CalldataValidationResult {
  if (rawCalldata === null || rawCalldata === undefined) {
    return {
      isValid: false,
      failure: {
        success: false,
        errorType: 'MISSING_CALLDATA',
        error: 'Calldata is missing or undefined.',
      },
    };
  }

  if (typeof rawCalldata !== 'string') {
    return {
      isValid: false,
      failure: {
        success: false,
        errorType: 'MISSING_CALLDATA',
        error: 'Calldata must be a string.',
      },
    };
  }

  if (rawCalldata.trim() === '') {
    return {
      isValid: false,
      failure: {
        success: false,
        errorType: 'MISSING_CALLDATA',
        error: 'Calldata is empty.',
      },
    };
  }

  // Check 0x prefix strictly without silently repairing
  if (!rawCalldata.startsWith('0x') && !rawCalldata.startsWith('0X')) {
    return {
      isValid: false,
      failure: {
        success: false,
        errorType: 'MISSING_PREFIX',
        error: "Calldata must begin with a '0x' prefix.",
      },
    };
  }

  const hexBody = rawCalldata.slice(2);

  // Check invalid hexadecimal characters
  if (hexBody.length > 0 && !/^[0-9a-fA-F]+$/.test(hexBody)) {
    return {
      isValid: false,
      failure: {
        success: false,
        errorType: 'INVALID_HEX',
        error: 'Calldata contains invalid hexadecimal characters.',
      },
    };
  }

  // Check odd length
  if (hexBody.length % 2 !== 0) {
    return {
      isValid: false,
      failure: {
        success: false,
        errorType: 'ODD_LENGTH',
        error: `Calldata has odd hexadecimal length (${hexBody.length} characters). Hex data must have an even number of characters.`,
      },
    };
  }

  // Check shorter than function selector (4 bytes = 8 hex chars)
  if (hexBody.length < 8) {
    const bytesPresent = hexBody.length / 2;
    return {
      isValid: false,
      failure: {
        success: false,
        errorType: 'TOO_SHORT',
        error: `Calldata is too short (${bytesPresent} byte${bytesPresent === 1 ? '' : 's'}). A function selector requires at least 4 bytes (8 hex characters).`,
      },
    };
  }

  const selector = `0x${hexBody.slice(0, 8).toLowerCase()}` as `0x${string}`;
  const fnMeta = SUPPORTED_SELECTORS[selector];

  // Check unsupported function selector
  if (!fnMeta) {
    return {
      isValid: false,
      failure: {
        success: false,
        errorType: 'UNSUPPORTED_SELECTOR',
        selector,
        error: `Unsupported function selector: ${selector}. Supported functions are: transfer(address,uint256), approve(address,uint256), transferFrom(address,address,uint256), balanceOf(address), allowance(address,address).`,
      },
    };
  }

  const totalBytes = hexBody.length / 2;
  const paramBytes = totalBytes - 4;

  // Check incomplete parameter data
  if (totalBytes < fnMeta.expectedByteLength) {
    const expectedParamBytes = fnMeta.expectedByteLength - 4;
    return {
      isValid: false,
      failure: {
        success: false,
        errorType: 'INCOMPLETE_DATA',
        selector,
        error: `Incomplete parameter data for ${fnMeta.signature}: expected ${fnMeta.expectedByteLength} bytes (${expectedParamBytes} bytes for parameters), but received ${totalBytes} bytes (${paramBytes} bytes for parameters).`,
      },
    };
  }

  // Check incorrect parameter lengths (too long or unaligned)
  if (totalBytes > fnMeta.expectedByteLength) {
    const expectedParamBytes = fnMeta.expectedByteLength - 4;
    return {
      isValid: false,
      failure: {
        success: false,
        errorType: 'INCORRECT_LENGTH',
        selector,
        error: `Incorrect parameter length for ${fnMeta.signature}: expected exactly ${fnMeta.expectedByteLength} bytes (${expectedParamBytes} bytes for parameters), but received ${totalBytes} bytes (${paramBytes} bytes for parameters).`,
      },
    };
  }

  return {
    isValid: true,
    calldata: `0x${hexBody}` as `0x${string}`,
    selector,
    fnMeta,
  };
}
