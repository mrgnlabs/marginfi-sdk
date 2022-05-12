import { BN } from '@project-serum/anchor';
import { PublicKey } from '@solana/web3.js';
import {
  BankData,
  MDecimalRaw,
  UTPAccountConfig,
  UTPObservationCache,
} from '.';

export enum AccountType {
  MarginfiGroup = 'MarginGroup',
  MarginAccount = 'MarginAccount',
}

export interface MarginfiGroupData {
  admin: PublicKey;
  bank: BankData;
  reservedSpace: BN[];
}

export interface MarginAccountData {
  authority: PublicKey;
  marginGroup: PublicKey;
  depositRecord: MDecimalRaw;
  borrowRecord: MDecimalRaw;
  activeUtps: boolean[];
  utpAccountConfig: UTPAccountConfig[];
  utpCache: UTPObservationCache[];
  reservedSpace: BN[];
}
