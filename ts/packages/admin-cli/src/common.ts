import { MDecimalRaw } from "@mrgnlabs/marginfi-client";
import { Decimal } from "@mrgnlabs/marginfi-client/src/utils/decimal";

export function parseDecimal(m: MDecimalRaw): number {
  let decimal = Decimal.fromMDecimal(m);
  let num = decimal.toNumber();
  return num;
}
