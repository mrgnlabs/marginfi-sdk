import { Decimal, MDecimalRaw } from "@mrgnlabs/marginfi-client";

export function parseDecimal(m: MDecimalRaw): number {
  let decimal = Decimal.fromMDecimal(m);
  let num = decimal.toNumber();
  return num;
}
