// Typescript port for rust decimal deserialization.

import { WasmDecimal } from "@mrgnlabs/marginfi-wasm-tools";
import { BN } from "@project-serum/anchor";
import { MDecimalRaw } from "../types";

const SCALE_SHIFT: number = 16;
const SIGN_SHIFT: number = 31;
const SCALE_MASK: number = 0x00ff_0000;
const SIGN_MASK: number = 0x8000_0000;
const U32_MASK: number = 0xffffffff;

/**
 * Wrapper class around fixed-point decimal struct as per the rust-decimal library.
 * Minimum feature set supported to allow conversion into more familiar BN type.
 * In particular: no support for math operations.
 */
export class Decimal {
  readonly flags: number;
  readonly hi: number;
  readonly lo: number;
  readonly mid: number;

  public constructor(flags: number, hi: number, lo: number, mid: number) {
    this.flags = flags;
    this.hi = hi;
    this.lo = lo;
    this.mid = mid;
  }

  static ZERO = new Decimal(0, 0, 0, 0);

  public static fromMDecimal(decimal: MDecimalRaw): Decimal {
    return new Decimal(decimal.flags, decimal.hi, decimal.lo, decimal.mid);
  }

  public static fromWasm(decimal: WasmDecimal): Decimal {
    return new Decimal(decimal.flags, decimal.hi, decimal.lo, decimal.mid);
  }

  public static fromBN(num: BN, scale: number): Decimal {
    if (scale > 28) {
      throw Error("scale must be 28 or less");
    }

    let neg = false;
    let wrapped = num;

    if (num.isNeg()) {
      neg = true;
      wrapped = num.neg();
    }

    let lo = wrapped.and(new BN(U32_MASK)).toNumber();
    let mid = wrapped.shrn(32).and(new BN(U32_MASK)).toNumber();
    let hi = wrapped.shrn(64).and(new BN(U32_MASK)).toNumber();
    let flags = this._flags(neg, scale);

    return new Decimal(flags, hi, lo, mid);
  }

  private static _flags(neg: boolean, scale: number): number {
    return (scale << SCALE_SHIFT) | ((neg ? 1 : 0) << SIGN_SHIFT);
  }

  public get scale(): number {
    return (this.flags & SCALE_MASK) >> SCALE_SHIFT;
  }

  toWasm(): WasmDecimal {
    return WasmDecimal.new(this.flags, this.hi, this.lo, this.mid);
  }

  toString() {
    const nb = this.toBN().toString();
    const scale = this.scale;
    if (scale == 0) {
      return nb;
    } else {
      const integer = nb.slice(0, nb.length - this.scale);
      const fractional = nb.slice(nb.length - this.scale, nb.length);
      return `${integer}.${fractional}`;
    }
  }

  public isNegative(): boolean {
    return (this.flags & SIGN_MASK) != 0;
  }

  public isPositive(): boolean {
    return (this.flags & SIGN_MASK) == 0;
  }

  public isUnset(): boolean {
    return this.hi == 0 && this.mid == 0 && this.lo == 0 && this.flags == 0;
  }

  public toBN(): BN {
    let nb = new BN(0);
    nb = nb.or(new BN(this.lo)).or(new BN(this.mid).shln(32)).or(new BN(this.hi).shln(64));

    if (this.isNegative()) {
      nb = nb.neg();
    }
    return nb;
  }

  public toNumber(): number {
    if (this.isUnset()) {
      return 0;
    }

    return (this.toBN().toString() as any) / 10 ** this.scale;
  }
}

export const printHex = (num: number, padding: number = 32) => {
  const buffer = new BN(num).toBuffer();
  const buffer_padded = Buffer.alloc(padding);
  buffer.copy(buffer_padded);
  console.log(buffer_padded.toString("hex"));
};
