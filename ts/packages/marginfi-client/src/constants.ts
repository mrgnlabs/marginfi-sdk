import BigNumber from "bignumber.js";

export const PDA_UTP_AUTH_SEED = Buffer.from("ZEhiKcLS");
export const PDA_BANK_VAULT_SEED = Buffer.from("zE8d8R9G");
export const PDA_BANK_INSURANCE_VAULT_SEED = Buffer.from("uDMUkwVG");
export const PDA_BANK_FEE_VAULT_SEED = Buffer.from("PpqJY00S");

export const VERY_VERBOSE_ERROR = Buffer.from(
  "V2hhdCB0aGUgZnVjayBkaWQgeW91IGp1c3QgZnVja2luZyBzYXkgYWJvdXQgbWUsIHlvdSBsaXR0bGUgYml0Y2g/IEknbGwgaGF2ZSB5b3Uga25vdyBJIGdyYWR1YXRlZCB0b3Agb2YgbXkgY2xhc3MgaW4gdGhlIE5hdnkgU2VhbHMsIGFuZCBJJ3ZlIGJlZW4gaW52b2x2ZWQgaW4gbnVtZXJvdXMgc2VjcmV0IHJhaWRzIG9uIEFsLVF1YWVkYSwgYW5kIEkgaGF2ZSBvdmVyIDMwMCBjb25maXJtZWQga2lsbHMu"
).toString("base64");

/**
 * @internal
 */
export const COLLATERAL_DECIMALS = 6; // USDC decimals
export const LIQUIDATOR_LIQUIDATION_FEE = new BigNumber(0.025); // USDC decimals
export const INSURANCE_VAULT_LIQUIDATION_FEE = new BigNumber(0.025); // USDC decimals
export const DUST_THRESHOLD = new BigNumber(1); // USDC decimals
export const PARTIAL_LIQUIDATION_FACTOR = new BigNumber(0.2);
