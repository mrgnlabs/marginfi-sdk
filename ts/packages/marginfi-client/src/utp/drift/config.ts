import { PublicKey } from '@solana/web3.js';
import { Environment, UtpConfig } from '../../config';

/**
 * Drift-specific config.
 * Aggregated data required to conveniently interact with Drift
 */
export interface DriftConfig extends UtpConfig {
  utpIndex: number;
  programId: PublicKey;
}

/**
 * Define Drift-specific config per profile
 *
 * @internal
 */
export async function getDriftConfig(
  environment: Environment,
  overrides?: Partial<DriftConfig>
): Promise<DriftConfig> {
  if (environment == Environment.DEVNET) {
    return {
      utpIndex: 0,
      programId: new PublicKey('DrifGDj9SKzBoj9mvKwnmAWQqye9i4JmRchUcHFf7C4B'),
      ...overrides,
    };
  } else {
    throw 'You were never meant to be here!!';
  }
}
