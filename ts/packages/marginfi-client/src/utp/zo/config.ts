import { Connection, PublicKey  } from '@solana/web3.js';
import { Environment, UtpConfig } from '../../config';
import * as ZoClient from "@zero_one/client";
import { ZO_DEVNET_STATE_KEY, ZO_DEX_DEVNET_PROGRAM_ID } from '@zero_one/client';


/**
 * Mango-specific config.
 * Aggregated data required to conveniently interact with Mango
 */
export interface ZoConfig extends UtpConfig {
  statePk: PublicKey,
  cluster: ZoClient.Cluster,
  dexProgram: PublicKey,
}

/**
 * Define Mango-specific config per profile
 *
 * @internal
 */
export async function getZoConfig(
  environment: Environment,
  _connection: Connection,
  overrides?: Partial<ZoConfig>
): Promise<ZoConfig> {
  if (environment == Environment.DEVNET) {
    return {
      utpIndex: 2,
      programId: ZoClient.ZERO_ONE_DEVNET_PROGRAM_ID,
      statePk: ZO_DEVNET_STATE_KEY,
      cluster: ZoClient.Cluster.Devnet,
      dexProgram: ZO_DEX_DEVNET_PROGRAM_ID,
      ...overrides,
    };
  } else {
    throw 'You were never meant to be here!!';
  }
}