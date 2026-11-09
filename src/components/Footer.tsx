import React from 'react';

export const Footer: React.FC = () => {
  return (
    <footer className="app-footer">
      <div className="footer-content">
        <div className="footer-brand">
          <img
            src="/botchain-logo.png"
            alt="BOT Chain Logo"
            className="footer-logo"
            width={32}
            height={32}
          />
          <span className="footer-brand-name">BOT Chain</span>
        </div>

        <div className="footer-links">
          <a
            href="https://botchain.ai/"
            target="_blank"
            rel="noopener noreferrer"
            className="footer-link"
          >
            Official Website (botchain.ai) ↗
          </a>
          <span className="footer-divider" aria-hidden="true">•</span>
          <a
            href="https://scan.bohr.life/"
            target="_blank"
            rel="noopener noreferrer"
            className="footer-link"
          >
            Bohr Testnet Explorer (scan.bohr.life) ↗
          </a>
        </div>
      </div>
      <div className="footer-note">
        Calldata Clinic is an open, read-only transaction calldata decoder and RPC lookup tool.
      </div>
    </footer>
  );
};
