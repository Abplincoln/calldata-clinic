import React, { useState } from 'react';
import { decodeCalldata } from '../decoder/decoder';
import { CALLDATA_PRESETS } from '../constants/presets';
import type { DecodedCalldataResult } from '../types/decoder';
import { DecodedResultView } from './DecodedResultView';

export const RawCalldataSection: React.FC = () => {
  const [calldataInput, setCalldataInput] = useState<string>('');
  const [decodedResult, setDecodedResult] = useState<DecodedCalldataResult | null>(null);

  const handleDecode = () => {
    const trimmed = calldataInput.trim();
    if (!trimmed) {
      setDecodedResult({
        success: false,
        errorType: 'MISSING_CALLDATA',
        error: 'Please enter hexadecimal transaction calldata.',
      });
      return;
    }
    const res = decodeCalldata(trimmed);
    setDecodedResult(res);
  };

  const handlePresetSelect = (presetCalldata: string) => {
    setCalldataInput(presetCalldata);
    // Automatically decode the selected preset for immediate feedback
    const res = decodeCalldata(presetCalldata);
    setDecodedResult(res);
  };

  const handleClear = () => {
    setCalldataInput('');
    setDecodedResult(null);
  };

  return (
    <section className="section-card" aria-labelledby="raw-calldata-title">
      <div className="section-header">
        <h2 id="raw-calldata-title" className="section-title">
          1. Raw Calldata Decoder
        </h2>
        <span className="section-tag">Client-side Only</span>
      </div>
      <p className="section-description">
        Paste raw hexadecimal transaction calldata to decode standard ERC-20 parameters offline.
      </p>

      {/* Preset Buttons */}
      <div className="presets-container">
        <span className="presets-label">Sample Presets:</span>
        <div className="presets-list">
          {CALLDATA_PRESETS.map((preset) => (
            <button
              key={preset.id}
              type="button"
              className="btn-preset"
              onClick={() => handlePresetSelect(preset.calldata)}
              title={preset.description}
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>

      {/* Calldata Textarea Input */}
      <div className="input-group">
        <label htmlFor="raw-calldata-input" className="input-label">
          Calldata Hex (0x...)
        </label>
        <textarea
          id="raw-calldata-input"
          className="textarea-calldata font-mono"
          rows={4}
          value={calldataInput}
          onChange={(e) => setCalldataInput(e.target.value)}
          placeholder="0xa9059cbb000000000000000000000000..."
          spellCheck={false}
        />
      </div>

      {/* Action Buttons */}
      <div className="actions-bar">
        <button
          type="button"
          className="btn-primary"
          onClick={handleDecode}
        >
          Decode Calldata
        </button>
        {calldataInput && (
          <button
            type="button"
            className="btn-secondary"
            onClick={handleClear}
          >
            Clear
          </button>
        )}
      </div>

      {/* Result Display */}
      {decodedResult && (
        <div className="result-container">
          <DecodedResultView result={decodedResult} rawInput={calldataInput} />
        </div>
      )}
    </section>
  );
};
