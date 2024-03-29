import { PublicKey } from "@solana/web3.js";
import BigNumber from "bignumber.js";
import { PARTIAL_LIQUIDATION_FACTOR } from "./constants";
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
  public readonly totalDepositsRecord: BigNumber;
  public readonly totalBorrowsRecord: BigNumber;
  public readonly mint: PublicKey;
  public readonly vault: PublicKey;
  public readonly bankAuthorityBump: number;
  public readonly insuranceVault: PublicKey;
  public readonly insuranceVaultAuthorityBump: number;
  public readonly feeVault: PublicKey;
  public readonly feeVaultAuthorityBump: number;
  public readonly initMarginRatio: BigNumber;
  public readonly maintMarginRatio: BigNumber;

  constructor(data: BankData) {
    this.scalingFactorC = wrappedI80F48toBigNumber(data.scalingFactorC, 0);
    this.fixedFee = wrappedI80F48toBigNumber(data.fixedFee, 0);
    this.interestFee = wrappedI80F48toBigNumber(data.interestFee, 0);
    this.depositAccumulator = wrappedI80F48toBigNumber(data.depositAccumulator, 0);
    this.borrowAccumulator = wrappedI80F48toBigNumber(data.borrowAccumulator, 0);
    this.lastUpdate = new Date(data.lastUpdate.toNumber());
    this.totalDepositsRecord = wrappedI80F48toBigNumber(data.totalDepositsRecord, 0);
    this.totalBorrowsRecord = wrappedI80F48toBigNumber(data.totalBorrowsRecord, 0);
    this.mint = data.mint;
    this.vault = data.vault;
    this.bankAuthorityBump = data.bankAuthorityBump;
    this.insuranceVault = data.insuranceVault;
    this.insuranceVaultAuthorityBump = data.insuranceVaultAuthorityBump;
    this.feeVault = data.feeVault;
    this.feeVaultAuthorityBump = data.feeVaultAuthorityBump;
    this.initMarginRatio = wrappedI80F48toBigNumber(data.initMarginRatio, 0);
    this.maintMarginRatio = wrappedI80F48toBigNumber(data.maintMarginRatio, 0);
  }

  get nativeDepositBalance(): BigNumber {
    return this.computeNativeAmount(this.totalDepositsRecord, LendingSide.Deposit).shiftedBy(-6);
  }

  get nativeBorrowBalance(): BigNumber {
    return this.computeNativeAmount(this.totalBorrowsRecord, LendingSide.Borrow).shiftedBy(-6);
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
    switch (type) {
      case MarginRequirementType.Init:
        return this.initMarginRatio;
      case MarginRequirementType.Maint:
        return this.maintMarginRatio;
      case MarginRequirementType.PartialLiquidation:
        return PARTIAL_LIQUIDATION_FACTOR.times(this.initMarginRatio.minus(this.maintMarginRatio)).plus(
          this.maintMarginRatio
        );
      default:
        throw Error(`Unknown margin requirement type: ${type}`);
    }
  }
}

export default Bank;
