import { PublicKey } from "@solana/web3.js";
import BigNumber from "bignumber.js";
import { BankData, MarginRequirementType } from "./types";
import { Decimal } from "./utils";

/**
 * Bank struct mirroring on-chain data
 * Contains the state of the marginfi group.
 */
export class Bank {
  public readonly scalingFactorC: BigNumber;
  public readonly fixedFee: BigNumber;
  public readonly interestFee: BigNumber;
  public readonly depositAccumulator: BigNumber;
  public readonly borrowAccumulator: BigNumber;
  public readonly lastUpdate: Date;
  public readonly nativeDepositBalance: BigNumber;
  public readonly nativeBorrowBalance: BigNumber;
  public readonly mint: PublicKey;
  public readonly vault: PublicKey;
  public readonly bankAutorityBump: number;
  public readonly insuranceVault: PublicKey;
  public readonly insuranceVaultAutorityBump: number;
  public readonly feeVault: PublicKey;
  public readonly feeVaultAutorityBump: number;
  public readonly initMarginRatio: BigNumber;
  public readonly maintMarginRatio: BigNumber;

  constructor(data: BankData) {
    this.scalingFactorC = new BigNumber(Decimal.fromAccountData(data.scalingFactorC).toNumber());
    this.fixedFee = new BigNumber(Decimal.fromAccountData(data.fixedFee).toNumber());
    this.interestFee = new BigNumber(Decimal.fromAccountData(data.interestFee).toNumber());
    this.depositAccumulator = new BigNumber(Decimal.fromAccountData(data.depositAccumulator).toNumber());
    this.borrowAccumulator = new BigNumber(Decimal.fromAccountData(data.borrowAccumulator).toNumber());
    this.lastUpdate = new Date(data.lastUpdate.toNumber());
    this.nativeDepositBalance = new BigNumber(Decimal.fromAccountData(data.nativeDepositBalance).toNumber());
    this.nativeBorrowBalance = new BigNumber(Decimal.fromAccountData(data.nativeBorrowBalance).toNumber());
    this.mint = data.mint;
    this.vault = data.vault;
    this.bankAutorityBump = data.bankAutorityBump;
    this.insuranceVault = data.insuranceVault;
    this.insuranceVaultAutorityBump = data.insuranceVaultAutorityBump;
    this.feeVault = data.feeVault;
    this.feeVaultAutorityBump = data.feeVaultAutorityBump;
    this.initMarginRatio = new BigNumber(Decimal.fromAccountData(data.initMarginRatio).toNumber());
    this.maintMarginRatio = new BigNumber(Decimal.fromAccountData(data.maintMarginRatio).toNumber());
  }

  getNativeAmount(record: BigNumber, side: LendingSide): BigNumber {
    if (side === LendingSide.Borrow) {
      return record.times(this.borrowAccumulator);
    } else if (side === LendingSide.Deposit) {
      return record.times(this.depositAccumulator);
    } else {
      throw Error(`Unknown lending side: ${side}`);
    }
  }

  getRecordAmount(record: BigNumber, side: LendingSide): BigNumber {
    if (side === LendingSide.Borrow) {
      return record.div(this.borrowAccumulator);
    } else if (side === LendingSide.Deposit) {
      return record.div(this.depositAccumulator);
    } else {
      throw Error(`Unknown lending side: ${side}`);
    }
  }

  getMarginRatio(type: MarginRequirementType): BigNumber {
    if (type === MarginRequirementType.Init) {
      return this.initMarginRatio;
    } else if (type === MarginRequirementType.Maint) {
      return this.maintMarginRatio;
    } else {
      throw Error(`Unknown margin requirement type: ${type}`);
    }
  }
}

export enum LendingSide {
  Borrow,
  Deposit,
}
