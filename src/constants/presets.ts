export interface CalldataPreset {
  id: string;
  label: string;
  description: string;
  calldata: string;
}

export const CALLDATA_PRESETS: CalldataPreset[] = [
  {
    id: 'transfer',
    label: 'transfer',
    description: 'transfer(recipient, amount: 1000000000000000000)',
    calldata:
      '0xa9059cbb00000000000000000000000070997970c51812dc3a010c7d01b50e0d17dc79c80000000000000000000000000000000000000000000000000de0b6b3a7640000',
  },
  {
    id: 'approve',
    label: 'approve',
    description: 'approve(spender, amount: 115792089237316195423570985008687907853269984665640564039457584007913129639935)',
    calldata:
      '0x095ea7b30000000000000000000000003c44cdddb6a900fa2b585dd299e03d12fa4293bcffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff',
  },
  {
    id: 'transferFrom',
    label: 'transferFrom',
    description: 'transferFrom(sender, recipient, amount: 500000000000000000)',
    calldata:
      '0x23b872dd00000000000000000000000070997970c51812dc3a010c7d01b50e0d17dc79c80000000000000000000000003c44cdddb6a900fa2b585dd299e03d12fa4293bc00000000000000000000000000000000000000000000000006f05b59d3b20000',
  },
  {
    id: 'balanceOf',
    label: 'balanceOf',
    description: 'balanceOf(account)',
    calldata:
      '0x70a08231000000000000000000000000f39fd6e51aad88f6f4ce6ab8827279cfffb92266',
  },
  {
    id: 'allowance',
    label: 'allowance',
    description: 'allowance(owner, spender)',
    calldata:
      '0xdd62ed3e000000000000000000000000f39fd6e51aad88f6f4ce6ab8827279cfffb9226600000000000000000000000070997970c51812dc3a010c7d01b50e0d17dc79c8',
  },
];
