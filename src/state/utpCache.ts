import { WasmObservation } from '@mrgnlabs/utp-utils';
import { format } from 'util';
import { BN } from '@project-serum/anchor';
import { COLLATERAL_DECIMALS } from '../constants';
import { UTPObservationCache } from '../types';
import { mDecimalToNative, wasmDecimalToNative } from '../utils';
import { Decimal } from '../utils/decimal';

/**
 * UtpCache struct mirroring on-chain data.
 * Contains a UTP health metrics.
 */
export class UtpCache {
  readonly totalCollateral: BN;
  readonly freeCollateral: BN;
  readonly marginRequirementInit: BN;
  readonly marginRequirementMaint: BN;
  readonly valid: boolean;

  static EMPTY = new UtpCache(
    new BN(0),
    new BN(0),
    new BN(0),
    new BN(0),
    false
  );

  constructor(
    totalCollateral: BN,
    freeCollateral: BN,
    marginRequirementInit: BN,
    marginRequirementMaint: BN,
    valid: boolean
  ) {
    this.totalCollateral = totalCollateral;
    this.freeCollateral = freeCollateral;
    this.marginRequirementInit = marginRequirementInit;
    this.marginRequirementMaint = marginRequirementMaint;
    this.valid = valid;
  }

  /* Factories */

  static fromAccountData(utpCache: UTPObservationCache) {
    return new UtpCache(
      mDecimalToNative(utpCache.totalCollateral),
      mDecimalToNative(utpCache.freeCollateral),
      mDecimalToNative(utpCache.marginRequirementInit),
      mDecimalToNative(utpCache.marginRequirementMaint),
      true
    );
  }

  static fromWasm(utpCache: WasmObservation) {
    return new UtpCache(
      wasmDecimalToNative(utpCache.total_collateral),
      wasmDecimalToNative(utpCache.free_collateral),
      wasmDecimalToNative(utpCache.margin_requirement_init),
      wasmDecimalToNative(utpCache.margin_requirement_maint),
      utpCache.valid
    );
  }

  toWasm(): WasmObservation {
    return WasmObservation.new(
      Decimal.fromBN(this.totalCollateral, COLLATERAL_DECIMALS).toWasm(),
      Decimal.fromBN(this.freeCollateral, COLLATERAL_DECIMALS).toWasm(),
      Decimal.fromBN(this.marginRequirementInit, COLLATERAL_DECIMALS).toWasm(),
      Decimal.fromBN(this.marginRequirementMaint, COLLATERAL_DECIMALS).toWasm(),
      this.valid
    );
  }

  toString() {
    return format(
      'Free Collateral %s\nTotal Collateral %s\nInit Margin Requirements: %s\nMaint Margin Requirements: %s\nvalid: %s',
      this.freeCollateral.toNumber(),
      this.totalCollateral.toNumber(),
      this.marginRequirementInit.toNumber(),
      this.marginRequirementMaint.toNumber(),
      this.valid
    );
  }
}
