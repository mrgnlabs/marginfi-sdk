import { BN } from "@project-serum/anchor";
import { Keypair, PublicKey, TransactionInstruction } from "@solana/web3.js";
import BigNumber from "bignumber.js";
import { UtpObservation } from "../utp/observation";
export * from "./accounts";

export enum UtpIndex {
  Mango = 0,
  ZO = 1,
}

export const UTP_NAME = {
  [UtpIndex.Mango]: "Mango",
  [UtpIndex.ZO]: "01",
};

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
