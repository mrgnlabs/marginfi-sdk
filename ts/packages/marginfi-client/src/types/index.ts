import { BN } from "@project-serum/anchor";
import { AccountMeta, Keypair, PublicKey, TransactionInstruction } from "@solana/web3.js";
import BigNumber from "bignumber.js";
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
  lpDepositLimit?: BN;
}

// TODO:
export interface UTPAccountConfig {
  address: PublicKey;
  authoritySeed: PublicKey;
  authorityBump: number;
}

export interface UtpData {
  isActive: boolean;
  accountConfig: UTPAccountConfig;
}

export interface UtpAccount {
  isActive: boolean;
  index: UtpIndex;
  address: PublicKey;
  cachedObservation: UtpObservation;
  getObservationAccounts: () => Promise<AccountMeta[]>;
  observe: () => Promise<UtpObservation>;
  deposit: (amount: BN) => Promise<string>;
  withdraw: (amount: BN) => Promise<string>;
}

export enum UtpIndex {
  Mango = 0,
  ZO = 1
}

export type ObservationCache = Map<UtpIndex, UtpObservation>;

export interface InstructionsWrapper {
  instructions: TransactionInstruction[];
  keys: Keypair[];
}

export enum MarginRequirementType {
  Init,
  Maint
}

export interface AccountBalances {
  equity: BigNumber;
  assets: BigNumber;
  liabilities: BigNumber;
}

export interface LiquidationPrices {
  finalPrice: BigNumber,
  discountedLiquidatorPrice: BigNumber,
  insuranceVaultFee: BigNumber
}
