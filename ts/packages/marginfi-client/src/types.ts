import { I80F48 } from "@blockworks-foundation/mango-client";
import { AnchorProvider, BN, Program } from "@project-serum/anchor";
import { SignerWalletAdapter } from "@solana/wallet-adapter-base";
import { Keypair, PublicKey, TransactionInstruction } from "@solana/web3.js";
import BigNumber from "bignumber.js";
import { Marginfi } from "./idl/marginfi";
import { MangoConfig } from "./utp/mango";
import { UtpObservation } from "./utp/observation";
import { ZetaConfig } from "./utp/zeta/config";
import { ZoConfig } from "./utp/zo";

export * from "./utp/zo/types";

export type MarginfiProgram = Omit<Program<Marginfi>, "provider"> & {
  provider: AnchorProvider;
};
export type MarginfiReadonlyProgram = Program<Marginfi>;

export type UiAmount = BigNumber | number | I80F48 | string;

export type Wallet = Pick<SignerWalletAdapter, "signAllTransactions" | "signTransaction"> & {
  publicKey: PublicKey;
};

export enum UtpIndex {
  Mango = 0,
  Zo = 1,
}

export const UTP_NAME = {
  [UtpIndex.Mango]: "Mango",
  [UtpIndex.Zo]: "01",
};

/**
 * Supported config environments.
 */
export enum Environment {
  DEVNET = "devnet",
  MAINNET = "mainnet",
}

/**
 * Marginfi bank vault type
 */
export enum BankVaultType {
  LiquidityVault,
  InsuranceVault,
  FeeVault,
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
  zeta: ZetaConfig;
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

export enum EquityType {
  InitReqAdjusted,
  Total,
}

export enum MarginRequirementType {
  Init,
  PartialLiquidation,
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

export enum MarginfiAccountType {
  NormalAccount,
  LPAccount,
}

export function toProgramMarginAccountType(orderType: MarginfiAccountType): IMarginfiAccountType {
  switch (orderType) {
    case MarginfiAccountType.NormalAccount:
      return { normalAccount: {} };
    case MarginfiAccountType.LPAccount:
      return { lpAccount: {} };
    default:
      throw new Error(`Unknown order type: ${orderType}`);
  }
}

export type IMarginfiAccountType = { normalAccount: {} } | { lpAccount: {} };

export interface MarginfiGroupData {
  admin: PublicKey;
  bank: BankData;
  reservedSpace: BN[];
}

export interface AccountFlags {
  flags: number;
}

export interface MarginfiAccountData {
  authority: PublicKey;
  marginfiGroup: PublicKey;
  depositRecord: WrappedI8048F;
  borrowRecord: WrappedI8048F;
  activeUtps: boolean[];
  utpAccountConfig: UTPAccountConfig[];
  flags: AccountFlags;
  reservedSpace: BN[];
}

export interface BankData {
  scalingFactorC: WrappedI8048F;
  fixedFee: WrappedI8048F;
  interestFee: WrappedI8048F;
  depositAccumulator: WrappedI8048F;
  borrowAccumulator: WrappedI8048F;
  lastUpdate: BN;
  totalDepositsRecord: WrappedI8048F;
  totalBorrowsRecord: WrappedI8048F;
  mint: PublicKey;
  vault: PublicKey;
  bankAuthorityBump: number;
  insuranceVault: PublicKey;
  insuranceVaultAuthorityBump: number;
  feeVault: PublicKey;
  feeVaultAuthorityBump: number;
  initMarginRatio: WrappedI8048F;
  maintMarginRatio: WrappedI8048F;
}
export interface WrappedI8048F {
  bits: BN;
}
