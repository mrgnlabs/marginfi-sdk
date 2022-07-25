import { MarginfiConfig } from "@mrgnlabs/marginfi-client";

import { Environment, getConfig, loadKeypair, MarginfiClient, Wallet } from "@mrgnlabs/marginfi-client";
import { Connection, PublicKey } from "@solana/web3.js";
import { OptionValues } from "commander";

export function getEnvironment(env: string): Environment {
  switch (env.toLowerCase()) {
    case "devnet":
      return Environment.DEVNET;
    case "mainnet-beta":
    case "mainnet":
      return Environment.MAINNET;
    default:
      throw new Error(`Unknown environment: ${env}`);
  }
}

export async function getClientFromOptions(options: OptionValues): Promise<MarginfiClient> {
  const connection = new Connection(options.url, "confirmed");
  const overrides: Partial<MarginfiConfig> = {
    programId: process.env.MARGINFI_PROGRAM ? new PublicKey(process.env.MARGINFI_PROGRAM) : undefined,
    groupPk: process.env.MARGINFI_GROUP ? new PublicKey(process.env.MARGINFI_GROUP) : undefined,
  };

  if (options.group) {
    overrides.groupPk = new PublicKey(options.group);
  }

  const config = await getConfig(getEnvironment(options.environment), connection, overrides);
  return MarginfiClient.fetch(config, new Wallet(loadKeypair(options.keypair)), connection);
}
