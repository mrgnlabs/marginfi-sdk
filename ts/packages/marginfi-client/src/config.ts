import { Connection, PublicKey } from '@solana/web3.js';
import { DriftConfig, getDriftConfig } from './utp/drift/config';
import { MangoConfig, getMangoConfig } from './utp/mango/config';

/**
 * Supported config environments.
 */
export enum Environment {
  DEVNET = 'devnet',
}

/**
 * Marginfi config.
 * Aggregated data required to conveniently interact with the program
 */
export interface MarginfiDedicatedConfig {
  environment: Environment;
  programId: PublicKey;
  groupPk: PublicKey;
  collateralMintPk: PublicKey;
}

export interface MarginfiConfig extends MarginfiDedicatedConfig {
  drift: DriftConfig;
  mango: MangoConfig;
}

/**
 * Marginfi generic UTP config.
 */
export interface UtpConfig {
  utpIndex: number;
  programId: PublicKey;
}

/**
 * Define marginfi-specific config per profile
 *
 * @internal
 */
export function getMarginfiConfig(
  environment: Environment,
  overrides?: Partial<
    Omit<MarginfiDedicatedConfig, 'environment' | 'drift' | 'mango'>
  >
): MarginfiDedicatedConfig {
  if (environment == Environment.DEVNET) {
    return {
      environment,
      programId:
        overrides?.programId ||
        new PublicKey('2KY2AYv9XRfqdyFqzYUixdN6ZP1qFnwjF2dpw5qum47V'),
      groupPk:
        overrides?.groupPk ||
        new PublicKey('7YChtFmc8DoU4ptvNqMNmh5MmZhWEw7oZ9BPmmyi3wXk'),
      collateralMintPk:
        overrides?.collateralMintPk ||
        new PublicKey('8FRFC6MoGGkMFQwngccyu69VnYbzykGeez7ignHVAFSN'),
    };
  } else {
    throw Error(`Unknown environment ${environment}`);
  }
}

/**
 * Retrieve
 */
export async function getConfig(
  environment: Environment,
  connection: Connection,
  overrides?: Partial<Omit<MarginfiConfig, 'environment'>>
): Promise<MarginfiConfig> {
  if (environment == Environment.DEVNET) {
    return {
      ...getMarginfiConfig(environment, overrides),
      drift: await getDriftConfig(environment, overrides?.drift),
      mango: await getMangoConfig(environment, connection, overrides?.mango),
    };
  } else {
    throw Error(`Unknown environment ${environment}`);
  }
}
