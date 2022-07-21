import { PublicKey } from "@solana/web3.js";
import BigNumber from "bignumber.js";
import { BankData, LendingSide, MarginRequirementType } from "./types";
import { wrappedI80F48toBigNumber } from "./utils/helpers";

/**
 * Bank struct mirroring on-chain data
 * Contains the state of the marginfi group.
 */
class Bank {
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
    this.scalingFactorC = wrappedI80F48toBigNumber(data.scalingFactorC), 0;
    this.fixedFee = wrappedI80F48toBigNumber(data.fixedFee, 0);
    this.interestFee = wrappedI80F48toBigNumber(data.interestFee, 0);
    this.depositAccumulator = wrappedI80F48toBigNumber(data.depositAccumulator, 0);
    this.borrowAccumulator = wrappedI80F48toBigNumber(data.borrowAccumulator, 0);
    this.lastUpdate = new Date(data.lastUpdate.toNumber());
    this.nativeDepositBalance = wrappedI80F48toBigNumber(data.nativeDepositBalance, 0);
    this.nativeBorrowBalance = wrappedI80F48toBigNumber(data.nativeBorrowBalance, 0);
    this.mint = data.mint;
    this.vault = data.vault;
    this.bankAutorityBump = data.bankAutorityBump;
    this.insuranceVault = data.insuranceVault;
    this.insuranceVaultAutorityBump = data.insuranceVaultAutorityBump;
    this.feeVault = data.feeVault;
    this.feeVaultAutorityBump = data.feeVaultAutorityBump;
    this.initMarginRatio = wrappedI80F48toBigNumber(data.initMarginRatio, 0);
    this.maintMarginRatio = wrappedI80F48toBigNumber(data.maintMarginRatio, 0);
  }

  public computeNativeAmount(record: BigNumber, side: LendingSide): BigNumber {
    if (side === LendingSide.Borrow) {
      return record.times(this.borrowAccumulator);
    } else if (side === LendingSide.Deposit) {
      return record.times(this.depositAccumulator);
    } else {
      throw Error(`Unknown lending side: ${side}`);
    }
  }

  public computeRecordAmount(record: BigNumber, side: LendingSide): BigNumber {
    if (side === LendingSide.Borrow) {
      return record.div(this.borrowAccumulator);
    } else if (side === LendingSide.Deposit) {
      return record.div(this.depositAccumulator);
    } else {
      throw Error(`Unknown lending side: ${side}`);
    }
  }

  public marginRatio(type: MarginRequirementType): BigNumber {
    if (type === MarginRequirementType.Init) {
      return this.initMarginRatio;
    } else if (type === MarginRequirementType.Maint) {
      return this.maintMarginRatio;
    } else {
      throw Error(`Unknown margin requirement type: ${type}`);
    }
  }
}

export default Bank;
