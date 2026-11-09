import React from 'react';
import { BOT_CHAIN_BOHR_TESTNET } from '../constants/botchain';

export const Header: React.FC = () => {
  return (
    <header className="app-header">
      <div className="header-top">
        <h1 className="app-title">Calldata Clinic</h1>
        <div className="network-badge">
          <span className="network-indicator" aria-hidden="true" />
          <span>{BOT_CHAIN_BOHR_TESTNET.networkName} (Chain ID: {BOT_CHAIN_BOHR_TESTNET.chainId})</span>
        </div>
      </div>
      <p className="app-subtitle">
        Read-only transaction calldata decoder and RPC lookup tool for BOT Chain.
      </p>
    </header>
  );
};
