import { Connection, PublicKey } from "@solana/web3.js";
import * as ZoClient from "@zero_one/client";
import {
  ZO_DEVNET_STATE_KEY,
  ZO_DEX_DEVNET_PROGRAM_ID,
  ZO_DEX_MAINNET_PROGRAM_ID,
  ZO_MAINNET_STATE_KEY,
} from "@zero_one/client";
import { Environment, UtpConfig } from "../../config";

/**
 * Mango-specific config.
 * Aggregated data required to conveniently interact with Mango
 */
export interface ZoConfig extends UtpConfig {
  statePk: PublicKey;
  cluster: ZoClient.Cluster;
  dexProgram: PublicKey;
}

/**
 * Define 01-specific config per profile
 *
 * @internal
 */
export async function getZoConfig(
  environment: Environment,
  _connection: Connection,
  overrides?: Partial<ZoConfig>
): Promise<ZoConfig> {
  switch (environment) {
    case Environment.MAINNET:
      return {
        utpIndex: 1,
        programId: ZoClient.ZERO_ONE_MAINNET_PROGRAM_ID,
        statePk: ZO_MAINNET_STATE_KEY,
        cluster: ZoClient.Cluster.Mainnet,
        dexProgram: ZO_DEX_MAINNET_PROGRAM_ID,
        ...overrides,
      };
    case Environment.DEVNET:
      return {
        utpIndex: 1,
        programId: ZoClient.ZERO_ONE_DEVNET_PROGRAM_ID,
        statePk: ZO_DEVNET_STATE_KEY,
        cluster: ZoClient.Cluster.Devnet,
        dexProgram: ZO_DEX_DEVNET_PROGRAM_ID,
        ...overrides,
      };
    default:
      throw "You were never meant to be here!!";
  }
}
