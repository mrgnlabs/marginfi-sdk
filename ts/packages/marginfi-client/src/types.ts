import { I80F48 } from "@blockworks-foundation/mango-client";
import { BN } from "@project-serum/anchor";
import { Keypair, PublicKey, TransactionInstruction } from "@solana/web3.js";
import BigNumber from "bignumber.js";
import { MangoConfig } from "./utp/mango";
import { UtpObservation } from "./utp/observation";
import { ZoConfig } from "./utp/zo";

export * from "./utp/mango/types";
export * from "./utp/zo/types";

export type UiAmount = BigNumber | number | I80F48 | string;

export enum UtpIndex {
  Mango = 0,
  ZO = 1,
}

export const UTP_NAME = {
  [UtpIndex.Mango]: "Mango",
  [UtpIndex.ZO]: "01",
};

/**
 * Supported config environments.
 */
export enum Environment {
  DEVNET = "devnet",
  MAINNET = "mainnet",
}

export interface MarginfiDedicatedConfig {
  environment: Environment;
  programId: PublicKey;
  groupPk: PublicKey;
  collateralMintPk: PublicKey;
}

/**
 * Marginfi config.
 * Aggregated data required to conveniently interact with the program
 */
export interface MarginfiConfig extends MarginfiDedicatedConfig {
  mango: MangoConfig;
  zo: ZoConfig;
}

/**
 * Marginfi generic UTP config.
 */
export interface UtpConfig {
  utpIndex: UtpIndex;
  programId: PublicKey;
}

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

export type ObservationCache = Map<UtpIndex, UtpObservation>;

export interface InstructionsWrapper {
  instructions: TransactionInstruction[];
  keys: Keypair[];
}

export enum MarginRequirementType {
  Init,
  Maint,
}

export interface AccountBalances {
  equity: BigNumber;
  assets: BigNumber;
  liabilities: BigNumber;
}

export interface LiquidationPrices {
  finalPrice: BigNumber;
  discountedLiquidatorPrice: BigNumber;
  insuranceVaultFee: BigNumber;
}

export enum LendingSide {
  Borrow,
  Deposit,
}

// --- On-chain account structs

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
