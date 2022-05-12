import { Connection, PublicKey } from '@solana/web3.js';
import { Environment, UtpConfig } from '../../config';
import {
  Config,
  IDS,
  MangoClient,
  MangoGroup,
} from '@blockworks-foundation/mango-client';

/**
 * Mango-specific config.
 * Aggregated data required to conveniently interact with Mango
 */
export interface MangoConfig extends UtpConfig {
  utpIndex: number;
  programId: PublicKey;
  group: MangoGroup;
}

/**
 * Define Mango-specific config per profile
 *
 * @internal
 */
export async function getMangoConfig(
  environment: Environment,
  connection: Connection,
  overrides?: Partial<MangoConfig>
): Promise<MangoConfig> {
  if (environment == Environment.DEVNET) {
    const mangoConfig = new Config(IDS);
    const groupConfig = mangoConfig.getGroup('devnet', 'devnet.2')!;
    const programId = groupConfig.mangoProgramId;
    const mangoRPCClient = new MangoClient(connection, programId);
    const mangoGroup = await mangoRPCClient.getMangoGroup(
      groupConfig.publicKey
    );
    return {
      utpIndex: 1,
      programId,
      group: mangoGroup,
      ...overrides,
    };
  } else {
    throw 'You were never meant to be here!!';
  }
}
