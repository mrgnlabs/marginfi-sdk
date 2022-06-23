import { BN } from "@project-serum/anchor";
import { AccountMeta, Keypair, PublicKey, TransactionInstruction } from "@solana/web3.js";
import { UtpObservation } from "../state";
export * from "./accounts";

/** @internal */
export interface GroupConfig {
  admin?: PublicKey;
  bank?: BankConfig;
  paused?: boolean;
}

/** @internal */
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
  insuranceVault: PublicKey;
  insuranceVaultAutorityBump: number;
  feeVault: PublicKey;
  feeVaultAutorityBump: number;
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

/** @internal */
export interface UTPObservationCache {
  totalCollateral: MDecimalRaw;
  freeCollateral: MDecimalRaw;
  marginRequirementInit: MDecimalRaw;
  marginRequirementMaint: MDecimalRaw;
  equity: MDecimalRaw;
}

export interface UtpData {
  isActive: boolean;
  accountConfig: UTPAccountConfig;
}

export interface UtpAccount {
  isActive: boolean;
  index: number;
  address: PublicKey;
  getObservationAccounts: () => Promise<AccountMeta[]>;
  observe: () => Promise<UtpObservation>;
  deposit: (amount: BN) => Promise<string>;
  withdraw: (amount: BN) => Promise<string>;
}

export interface IndexedObservation {
  utp_index: number;
  observation: UtpObservation;
}

export interface InstructionsWrapper {
  instructions: TransactionInstruction[];
  keys: Keypair[];
}
