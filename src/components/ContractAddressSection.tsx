import React, { useState } from 'react';
import { validateContractAddress } from '../decoder/addressValidator';
import type { AddressValidationResult } from '../types/decoder';
import { CopyButton } from './CopyButton';

export const ContractAddressSection: React.FC = () => {
  const [addressInput, setAddressInput] = useState<string>('');
  const [validationResult, setValidationResult] = useState<AddressValidationResult | null>(null);

  const handleValidate = () => {
    const res = validateContractAddress(addressInput);
    setValidationResult(res);
  };

  const handleClear = () => {
    setAddressInput('');
    setValidationResult(null);
  };

  return (
    <section className="section-card" aria-labelledby="address-validator-title">
      <div className="section-header">
        <h2 id="address-validator-title" className="section-title">
          3. Contract Address Validator
        </h2>
        <span className="section-tag">Format & Checksum</span>
      </div>
      <p className="section-description">
        Verify that a candidate contract address conforms to 20-byte hexadecimal and EIP-55 checksum standards.
      </p>

      <div className="input-group">
        <label htmlFor="contract-address-input" className="input-label">
          Contract Address (20 bytes)
        </label>
        <input
          id="contract-address-input"
          type="text"
          className="input-text font-mono"
          value={addressInput}
          onChange={(e) => {
            setAddressInput(e.target.value);
            if (validationResult) setValidationResult(null);
          }}
          placeholder="0x70997970C51812dc3A010C7d01b50e0d17dc79C8"
          spellCheck={false}
        />
      </div>

      <div className="actions-bar">
        <button
          type="button"
          className="btn-primary"
          onClick={handleValidate}
        >
          Validate Address
        </button>
        {addressInput && (
          <button
            type="button"
            className="btn-secondary"
            onClick={handleClear}
          >
            Clear
          </button>
        )}
      </div>

      {validationResult && (
        <div className="result-container">
          {validationResult.isValid ? (
            <div className="result-card success-card">
              <div className="card-header">
                <span className="badge badge-success">Valid Address Format</span>
                {validationResult.isChecksummed && (
                  <span className="selector-chip">EIP-55 Checksum Verified</span>
                )}
              </div>

              <div className="meta-grid">
                <div className="meta-item">
                  <span className="meta-label">Supplied Address:</span>
                  <div className="code-row">
                    <span className="meta-value font-mono break-all">{validationResult.address}</span>
                    {validationResult.address && (
                      <CopyButton text={validationResult.address} label="Copy" className="btn-copy-small" />
                    )}
                  </div>
                </div>

                <div className="meta-item">
                  <span className="meta-label">EIP-55 Checksummed:</span>
                  <div className="code-row">
                    <span className="meta-value font-mono break-all">
                      {validationResult.checksummedAddress}
                    </span>
                    {validationResult.checksummedAddress && (
                      <CopyButton
                        text={validationResult.checksummedAddress}
                        label="Copy Checksummed"
                        className="btn-copy-small"
                      />
                    )}
                  </div>
                </div>
              </div>

              <div className="notice-banner notice-neutral">
                <span className="notice-icon">ℹ</span>
                <span>
                  <strong>Note:</strong> Syntax validation confirms correct address format and checksum. It does not verify or imply that a smart contract is deployed on-chain at this address.
                </span>
              </div>
            </div>
          ) : (
            <div className="result-card error-card">
              <div className="card-header">
                <span className="badge badge-error">Invalid Address</span>
              </div>
              <p className="error-message">{validationResult.error}</p>
            </div>
          )}
        </div>
      )}
    </section>
  );
};
