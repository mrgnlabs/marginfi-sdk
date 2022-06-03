import { get_utp_liquidator_price, WasmObservation } from "@mrgnlabs/marginfi-wasm-tools";
import { BN } from "@project-serum/anchor";
import { toBufferBE } from "bigint-buffer";
import { format } from "util";
import { UTPObservationCache } from "../types";
import { mDecimalToNative } from "../utils";

export interface WasmObservationJson {
  total_collateral: string;
  free_collateral: string;
  margin_requirement_init: string;
  margin_requirement_maint: string;
  equity: string;
  valid: boolean;
}

/**
 * UtpObservation struct mirroring on-chain data.
 * Contains a UTP health metrics.
 */
export class UtpObservation {
  static EMPTY = new UtpObservation(new BN(0), new BN(0), new BN(0), new BN(0), new BN(0), false);

  constructor(
    readonly totalCollateral: BN,
    readonly freeCollateral: BN,
    readonly marginRequirementInit: BN,
    readonly marginRequirementMaint: BN,
    readonly equity: BN,
    readonly valid: boolean
  ) {}

  /* Factories */

  static fromAccountData(o: UTPObservationCache) {
    return new UtpObservation(
      mDecimalToNative(o.totalCollateral),
      mDecimalToNative(o.freeCollateral),
      mDecimalToNative(o.marginRequirementInit),
      mDecimalToNative(o.marginRequirementMaint),
      mDecimalToNative(o.equity),
      true
    );
  }

  static fromWasm(o: WasmObservation) {
    return new UtpObservation(
      new BN(o.total_collateral.toString()),
      new BN(o.free_collateral.toString()),
      new BN(o.margin_requirement_init.toString()),
      new BN(o.margin_requirement_maint.toString()),
      new BN(o.equity.toString()),
      o.valid
    );
  }

  toWasm(): WasmObservation {
    return WasmObservation.new(
      BigInt(this.totalCollateral.toString()),
      BigInt(this.freeCollateral.toString()),
      BigInt(this.marginRequirementInit.toString()),
      BigInt(this.marginRequirementMaint.toString()),
      BigInt(this.equity.toString()),
      this.valid
    );
  }

  toWasmJson(): WasmObservationJson {
    return {
      total_collateral: this.totalCollateral.toString(),
      free_collateral: this.freeCollateral.toString(),
      margin_requirement_init: this.marginRequirementInit.toString(),
      margin_requirement_maint: this.marginRequirementMaint.toString(),
      equity: this.equity.toString(),
      valid: this.valid,
    };
  }

  toString() {
    return format(
      "Equity: %s\nFree Collateral: %s\nTotal Collateral: %s\nInit Margin Requirements: %s\nMaint Margin Requirements: %s\nvalid: %s",
      this.equity.toNumber(),
      this.freeCollateral.toNumber(),
      this.totalCollateral.toNumber(),
      this.marginRequirementInit.toNumber(),
      this.marginRequirementMaint.toNumber()
    );
  }

  liquidatorPrice() {
    let price = get_utp_liquidator_price(this.toWasm()).valueOf();
    return new BN(toBufferBE(price, 8), undefined, "be");
  }
}
