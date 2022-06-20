import { getClientFromEnv } from "@mrgnlabs/marginfi-client";

export async function createAccount() {
  const client = await getClientFromEnv();

  const account = await client.createMarginfiAccount();
  console.log("Marginfi account address %s", account.publicKey);
}
