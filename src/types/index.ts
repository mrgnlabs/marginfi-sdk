import { BN } from '@project-serum/anchor';
import { PublicKey, TransactionInstruction } from '@solana/web3.js';
import { UtpCache } from '../state';
export * from './accounts';

export interface GroupConfig {
  admin?: PublicKey;
  bank?: BankConfig;
  paused?: boolean;
}

export interface BankConfig {
  scalingFactorC?: BN;
  fixedFee?: BN;
  interestFee?: BN;
  initMarginRatio?: BN;
  maintMarginRatio?: BN;
  accountDepositLimit?: BN;
}

export interface BankData {
  scalingFactorC: MDecimalRaw;
  fixedFee: MDecimalRaw;
  interestFee: MDecimalRaw;
  depositAccumulator: MDecimalRaw;
  borrowAccumulator: MDecimalRaw;
  lastUpdate: BN;
  nativeDepositBalance: MDecimalRaw;
  nativeBorrowBalance: MDecimalRaw;
  mint: PublicKey;
  vault: PublicKey;
  bankAutorityBump: number;
  insuranceVaultBalance: MDecimalRaw;
  initMarginRatio: MDecimalRaw;
  maintMarginRatio: MDecimalRaw;
}

export interface MDecimalRaw {
  flags: number;
  hi: number;
  lo: number;
  mid: number;
}

// TODO:
export interface UTPAccountConfig {
  address: PublicKey;
  authoritySeed: PublicKey;
  authorityBump: number;
}

// TODO:
export interface UTPObservationCache {
  totalCollateral: MDecimalRaw;
  freeCollateral: MDecimalRaw;
  marginRequirementInit: MDecimalRaw;
  marginRequirementMaint: MDecimalRaw;
}

export interface UtpData {
  isActive: boolean;
  accountConfig: UTPAccountConfig;
  accountCache: UTPObservationCache;
}

export interface UtpAccount {
  isActive: boolean;
  index: number;
  makeObserveIx: () => Promise<TransactionInstruction>;
  localObserve: () => Promise<UtpCache>;
  depositCrank: (amount: BN) => Promise<string>;
  withdraw: (amount: BN) => Promise<string>;
}

export enum InstructionLayout {
  ObserveBefore,
  ObserveAndCheckAfter,
  HalfSandwichObserveCheck,
}
