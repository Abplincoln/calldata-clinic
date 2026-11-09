import React, { useState } from 'react';
import { getTransactionByHash } from '../rpc/rpcService';
import type { RpcLookupResult } from '../types/rpc';
import { CopyButton } from './CopyButton';
import { DecodedResultView } from './DecodedResultView';

// Verified sample transaction on BOT Chain Bohr Testnet for easy testing
const SAMPLE_TESTNET_TX = '0x9b2dc0d502cd2464956e7019a75604973f7cff23312817f1c8590a0bef288b3a';

export const TxLookupSection: React.FC = () => {
  const [txHashInput, setTxHashInput] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [lookupResult, setLookupResult] = useState<RpcLookupResult | null>(null);

  const handleLookup = async (hashToLookup?: string) => {
    const targetHash = (hashToLookup ?? txHashInput).trim();
    if (!targetHash) {
      setLookupResult({
        success: false,
        errorType: 'INVALID_TX_HASH',
        error: 'Please enter a 66-character transaction hash.',
      });
      return;
    }

    setIsLoading(true);
    setLookupResult(null);

    try {
      const res = await getTransactionByHash(targetHash);
      setLookupResult(res);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoadSampleTx = () => {
    setTxHashInput(SAMPLE_TESTNET_TX);
    handleLookup(SAMPLE_TESTNET_TX);
  };

  const handleClear = () => {
    setTxHashInput('');
    setLookupResult(null);
  };

  return (
    <section className="section-card" aria-labelledby="tx-lookup-title">
      <div className="section-header">
        <h2 id="tx-lookup-title" className="section-title">
          2. Transaction Hash Lookup
        </h2>
        <span className="section-tag section-tag-rpc">BOT Chain RPC</span>
      </div>
      <p className="section-description">
        Fetch transaction metadata and decode its calldata directly from the BOT Chain Bohr Testnet RPC (
        <code>https://rpc.bohr.life</code>).
      </p>

      {/* Input Group */}
      <div className="input-group">
        <div className="input-header-row">
          <label htmlFor="tx-hash-input" className="input-label">
            Transaction Hash (32 bytes)
          </label>
          <button
            type="button"
            className="btn-link"
            onClick={handleLoadSampleTx}
          >
            Load Sample Testnet Tx
          </button>
        </div>
        <input
          id="tx-hash-input"
          type="text"
          className="input-text font-mono"
          value={txHashInput}
          onChange={(e) => setTxHashInput(e.target.value)}
          placeholder="0x9b2dc0d502cd2464956e7019a75604973f7cff23312817f1c8590a0bef288b3a"
          spellCheck={false}
          disabled={isLoading}
        />
      </div>

      {/* Action Buttons */}
      <div className="actions-bar">
        <button
          type="button"
          className="btn-primary"
          onClick={() => handleLookup()}
          disabled={isLoading}
        >
          {isLoading ? 'Querying RPC...' : 'Lookup Transaction'}
        </button>
        {txHashInput && !isLoading && (
          <button
            type="button"
            className="btn-secondary"
            onClick={handleClear}
          >
            Clear
          </button>
        )}
      </div>

      {/* Loading Indicator */}
      {isLoading && (
        <div className="status-box status-loading" role="status">
          <span className="spinner" aria-hidden="true" />
          <span>Querying BOT Chain Bohr Testnet RPC (https://rpc.bohr.life)...</span>
        </div>
      )}

      {/* Error Display */}
      {lookupResult && !lookupResult.success && (
        <div className="result-card error-card" role="alert">
          <div className="card-header">
            <span className="badge badge-error">Lookup Error: {lookupResult.errorType}</span>
            {lookupResult.statusCode && (
              <span className="selector-chip">HTTP {lookupResult.statusCode}</span>
            )}
            {lookupResult.rpcErrorCode && (
              <span className="selector-chip">Code {lookupResult.rpcErrorCode}</span>
            )}
          </div>
          <p className="error-message">{lookupResult.error}</p>
        </div>
      )}

      {/* Successful Transaction Details Display */}
      {lookupResult && lookupResult.success && (
        <div className="tx-details-container">
          <div className="result-card tx-meta-card">
            <div className="card-header">
              <span className="tx-card-title">Transaction Details</span>
              <a
                href={lookupResult.transaction.explorerUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="explorer-link"
              >
                View on Bohr Explorer ↗
              </a>
            </div>

            {/* Execution Receipt Notice */}
            <div className="notice-banner">
              <span className="notice-icon">ℹ</span>
              <span>{lookupResult.transaction.executionStatusNote}</span>
            </div>

            {/* Transaction Properties Table */}
            <div className="meta-grid">
              <div className="meta-item">
                <span className="meta-label">Tx Hash:</span>
                <div className="code-row">
                  <span className="meta-value font-mono break-all">{lookupResult.transaction.hash}</span>
                  <CopyButton text={lookupResult.transaction.hash} label="Copy" className="btn-copy-small" />
                </div>
              </div>

              <div className="meta-item">
                <span className="meta-label">From:</span>
                <div className="code-row">
                  <span className="meta-value font-mono break-all">{lookupResult.transaction.from}</span>
                  <CopyButton text={lookupResult.transaction.from} label="Copy" className="btn-copy-small" />
                </div>
              </div>

              <div className="meta-item">
                <span className="meta-label">To (Destination):</span>
                {lookupResult.transaction.to ? (
                  <div className="code-row">
                    <span className="meta-value font-mono break-all">{lookupResult.transaction.to}</span>
                    <CopyButton text={lookupResult.transaction.to} label="Copy" className="btn-copy-small" />
                  </div>
                ) : (
                  <div className="contract-creation-alert">
                    <span className="badge badge-warning">Contract Creation</span>
                    <p className="subtext">
                      {lookupResult.transaction.contractCreationNote ||
                        'Destination address is null. This transaction creates a new contract. This MVP does not inspect deployment bytecode.'}
                    </p>
                  </div>
                )}
              </div>

              <div className="meta-row-two-col">
                <div className="meta-item">
                  <span className="meta-label">Block Number:</span>
                  <span className="meta-value font-mono">
                    {lookupResult.transaction.blockNumber !== null ? (
                      lookupResult.transaction.blockNumber.toString()
                    ) : (
                      <span className="badge badge-warning">Pending / Unconfirmed</span>
                    )}
                  </span>
                </div>

                <div className="meta-item">
                  <span className="meta-label">Gas Limit:</span>
                  <span className="meta-value font-mono">
                    {lookupResult.transaction.gasLimit.toString()}
                  </span>
                </div>
              </div>

              <div className="meta-item">
                <span className="meta-label">Value:</span>
                <span className="meta-value font-mono">
                  {lookupResult.transaction.valueWei.toString()} wei ({lookupResult.transaction.valueRaw})
                </span>
              </div>
            </div>

            {/* Calldata Section */}
            <div className="tx-calldata-wrapper">
              <h4 className="calldata-header">Transaction Calldata</h4>
              {!lookupResult.transaction.hasCalldata ? (
                <div className="notice-banner notice-neutral">
                  <span>No calldata is present (input is 0x).</span>
                </div>
              ) : (
                <>
                  <div className="code-row raw-input-row">
                    <code className="font-mono break-all input-code">
                      {lookupResult.transaction.input}
                    </code>
                    <CopyButton
                      text={lookupResult.transaction.input}
                      label="Copy Calldata"
                      className="btn-copy-small"
                    />
                  </div>

                  {lookupResult.decodedCalldata && (
                    <div className="nested-decoded-view">
                      <DecodedResultView
                        result={lookupResult.decodedCalldata}
                        rawInput={lookupResult.transaction.input}
                      />
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
