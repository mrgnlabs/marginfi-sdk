import { BN } from '@project-serum/anchor';
import { PublicKey } from '@solana/web3.js';
import { BankData } from '../types';
import { Decimal } from '../utils/decimal';

/**
 * Bank struct mirroring on-chain data
 * Contains the state of the marginfi group.
 */
export class Bank {
  readonly scalingFactorC: Decimal;
  readonly fixedFee: Decimal;
  readonly interestFee: Decimal;
  readonly depositAccumulator: Decimal;
  readonly borrowAccumulator: Decimal;
  readonly lastUpdate: BN;
  readonly nativeDepositBalance: Decimal;
  readonly nativeBorrowBalance: Decimal;
  readonly mint: PublicKey;
  readonly vault: PublicKey;
  readonly bankAutorityBump: number;
  readonly insuranceVaultBalance: Decimal;
  readonly initMarginRatio: Decimal;
  readonly maintMarginRatio: Decimal;

  constructor(
    scalingFactorC: Decimal,
    fixedFee: Decimal,
    interestFee: Decimal,
    depositAccumulator: Decimal,
    borrowAccumulator: Decimal,
    lastUpdate: BN,
    nativeDepositBalance: Decimal,
    nativeBorrowBalance: Decimal,
    mint: PublicKey,
    vault: PublicKey,
    bankAutorityBump: number,
    insuranceVaultBalance: Decimal,
    initMarginRatio: Decimal,
    maintMarginRatio: Decimal
  ) {
    this.scalingFactorC = scalingFactorC;
    this.fixedFee = fixedFee;
    this.interestFee = interestFee;
    this.depositAccumulator = depositAccumulator;
    this.borrowAccumulator = borrowAccumulator;
    this.lastUpdate = lastUpdate;
    this.nativeDepositBalance = nativeDepositBalance;
    this.nativeBorrowBalance = nativeBorrowBalance;
    this.mint = mint;
    this.vault = vault;
    this.bankAutorityBump = bankAutorityBump;
    this.insuranceVaultBalance = insuranceVaultBalance;
    this.initMarginRatio = initMarginRatio;
    this.maintMarginRatio = maintMarginRatio;
  }

  static from(bankData: BankData) {
    return new Bank(
      Decimal.fromMDecimal(bankData.scalingFactorC),
      Decimal.fromMDecimal(bankData.fixedFee),
      Decimal.fromMDecimal(bankData.interestFee),
      Decimal.fromMDecimal(bankData.depositAccumulator),
      Decimal.fromMDecimal(bankData.borrowAccumulator),
      bankData.lastUpdate,
      Decimal.fromMDecimal(bankData.nativeDepositBalance),
      Decimal.fromMDecimal(bankData.nativeBorrowBalance),
      bankData.mint,
      bankData.vault,
      bankData.bankAutorityBump,
      Decimal.fromMDecimal(bankData.insuranceVaultBalance),
      Decimal.fromMDecimal(bankData.initMarginRatio),
      Decimal.fromMDecimal(bankData.maintMarginRatio)
    );
  }
}
