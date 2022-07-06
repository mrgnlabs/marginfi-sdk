import { BN } from "@project-serum/anchor";
import { PublicKey } from "@solana/web3.js";
import { UTPAccountConfig } from ".";

export enum AccountType {
  MarginfiGroup = "marginfiGroup",
  MarginfiAccount = "marginfiAccount",
}

export interface MarginfiGroupData {
  admin: PublicKey;
  bank: BankData;
  reservedSpace: BN[];
}

export interface MarginfiAccountData {
  authority: PublicKey;
  marginfiGroup: PublicKey;
  depositRecord: DecimalData;
  borrowRecord: DecimalData;
  activeUtps: boolean[];
  utpAccountConfig: UTPAccountConfig[];
  reservedSpace: BN[];
}

export interface BankData {
  scalingFactorC: DecimalData;
  fixedFee: DecimalData;
  interestFee: DecimalData;
  depositAccumulator: DecimalData;
  borrowAccumulator: DecimalData;
  lastUpdate: BN;
  nativeDepositBalance: DecimalData;
  nativeBorrowBalance: DecimalData;
  mint: PublicKey;
  vault: PublicKey;
  bankAutorityBump: number;
  insuranceVault: PublicKey;
  insuranceVaultAutorityBump: number;
  feeVault: PublicKey;
  feeVaultAutorityBump: number;
  initMarginRatio: DecimalData;
  maintMarginRatio: DecimalData;
}

export interface DecimalData {
  flags: number;
  hi: number;
  lo: number;
  mid: number;
}
