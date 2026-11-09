export type SupportedFunctionName =
  | 'transfer'
  | 'approve'
  | 'transferFrom'
  | 'balanceOf'
  | 'allowance';

export type SolidityType = 'address' | 'uint256';

export interface FunctionInputMeta {
  name: string;
  type: SolidityType;
}

export interface FunctionMeta {
  name: SupportedFunctionName;
  signature: string;
  selector: `0x${string}`;
  inputs: FunctionInputMeta[];
  expectedParamCount: number;
  expectedByteLength: number;
}

export interface DecodedAddressParameter {
  name: string;
  type: 'address';
  value: `0x${string}`;
  formattedValue: string;
}

export interface DecodedUint256Parameter {
  name: string;
  type: 'uint256';
  value: bigint;
  formattedValue: string;
}

export type DecodedParameter = DecodedAddressParameter | DecodedUint256Parameter;

export interface DecodedCalldataSuccess {
  success: true;
  functionName: SupportedFunctionName;
  signature: string;
  selector: `0x${string}`;
  parameters: DecodedParameter[];
}

export type ValidationErrorType =
  | 'MISSING_CALLDATA'
  | 'MISSING_PREFIX'
  | 'INVALID_HEX'
  | 'ODD_LENGTH'
  | 'TOO_SHORT'
  | 'UNSUPPORTED_SELECTOR'
  | 'INCOMPLETE_DATA'
  | 'INCORRECT_LENGTH'
  | 'DECODE_ERROR';

export interface DecodedCalldataFailure {
  success: false;
  errorType: ValidationErrorType;
  selector?: string;
  error: string;
}

export type DecodedCalldataResult = DecodedCalldataSuccess | DecodedCalldataFailure;

export interface AddressValidationResult {
  isValid: boolean;
  address?: `0x${string}`;
  checksummedAddress?: `0x${string}`;
  isChecksummed?: boolean;
  error?: string;
}
