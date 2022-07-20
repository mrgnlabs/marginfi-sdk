import BN from "bn.js";
import BigNumber from "bignumber.js";

export function wrappedI80F48toBigNumber({ bits }: { bits: BN }): BigNumber {
    return new BigNumber(`${bits.isNeg() ? "-" : ""}0b${bits.abs().toString(2)}p-48`) 
}