import { Decimal, getClientFromEnv, MarginfiClient, MDecimalRaw } from "@mrgnlabs/marginfi-client";

export function parseDecimal(m: MDecimalRaw): number {
  let decimal = Decimal.fromMDecimal(m);
  let num = decimal.toNumber();
  return num;
}

export async function getEnvClient(): Promise<MarginfiClient> {
  return getClientFromEnv();
}
