import { BN } from '@project-serum/anchor';

export interface DriftOpenPositionArgs {
  direction: any; // TODO: type
  quoteAssetAmount: BN;
  marketIndex: BN;
  limitPrice: BN;
  optionalAccounts: any;
}

export interface DriftClosePositionArgs {
  marketIndex: BN;
  optionalAccounts: any; // TODO: type
}
