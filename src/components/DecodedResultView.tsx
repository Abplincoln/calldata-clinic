import React from 'react';
import type { DecodedCalldataResult } from '../types/decoder';
import { CopyButton } from './CopyButton';

interface DecodedResultViewProps {
  result: DecodedCalldataResult;
  rawInput?: string;
}

export const DecodedResultView: React.FC<DecodedResultViewProps> = ({
  result,
  rawInput,
}) => {
  if (!result.success) {
    return (
      <div className="result-card error-card">
        <div className="card-header">
          <span className="badge badge-error">
            {result.errorType === 'UNSUPPORTED_SELECTOR'
              ? 'Unsupported Function'
              : 'Validation Error'}
          </span>
          {result.selector && (
            <span className="selector-chip font-mono">Selector: {result.selector}</span>
          )}
        </div>
        <p className="error-message">{result.error}</p>
        {rawInput && (
          <div className="raw-calldata-box">
            <span className="field-label">Raw Calldata:</span>
            <div className="code-row">
              <code className="font-mono break-all">{rawInput}</code>
              <CopyButton text={rawInput} label="Copy Raw" />
            </div>
          </div>
        )}
      </div>
    );
  }

  const isViewBalanceOrAllowance =
    result.functionName === 'balanceOf' || result.functionName === 'allowance';

  return (
    <div className="result-card success-card">
      <div className="card-header">
        <div>
          <span className="function-name">{result.functionName}</span>
          <span className="badge badge-success">Supported ERC-20</span>
        </div>
        <span className="selector-chip font-mono">
          {result.selector}
          <CopyButton text={result.selector} label="Copy" className="btn-copy-small" />
        </span>
      </div>

      <div className="signature-box">
        <span className="field-label">Canonical Signature:</span>
        <div className="code-row">
          <code className="font-mono">{result.signature}</code>
          <CopyButton text={result.signature} label="Copy Signature" />
        </div>
      </div>

      {isViewBalanceOrAllowance && (
        <div className="notice-banner">
          <span className="notice-icon">ℹ</span>
          <span>
            <strong>Note:</strong> This tool decodes input parameters only. It does not retrieve or display the actual on-chain token balance or allowance.
          </span>
        </div>
      )}

      <div className="params-section">
        <h4 className="params-title">Decoded Parameters ({result.parameters.length})</h4>
        <div className="table-responsive">
          <table className="params-table">
            <thead>
              <tr>
                <th>Parameter Name</th>
                <th>Solidity Type</th>
                <th>Decoded Value</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {result.parameters.map((param, index) => (
                <tr key={`${param.name}-${index}`}>
                  <td className="param-name font-mono">{param.name}</td>
                  <td>
                    <span className="type-badge font-mono">{param.type}</span>
                  </td>
                  <td className="param-value font-mono break-all">
                    {param.formattedValue}
                  </td>
                  <td>
                    <CopyButton
                      text={param.formattedValue}
                      label="Copy Value"
                      className="btn-copy-small"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
