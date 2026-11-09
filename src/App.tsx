import React from 'react';
import { Header } from './components/Header';
import { RawCalldataSection } from './components/RawCalldataSection';
import { TxLookupSection } from './components/TxLookupSection';
import { ContractAddressSection } from './components/ContractAddressSection';
import { Footer } from './components/Footer';

export const App: React.FC = () => {
  return (
    <div className="app-layout">
      <Header />
      <main className="main-content">
        <RawCalldataSection />
        <TxLookupSection />
        <ContractAddressSection />
      </main>
      <Footer />
    </div>
  );
};

export default App;
