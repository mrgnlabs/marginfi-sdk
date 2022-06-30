import { Connection, PublicKey } from "@solana/web3.js";
import { getMangoConfig, MangoConfig } from "./utp/mango/config";
import { getZoConfig, ZoConfig } from "./utp/zo";

/**
 * Supported config environments.
 */
export enum Environment {
  DEVNET = "devnet",
  MAINNET = "mainnet",
}

export interface MarginfiDedicatedConfig {
  environment: Environment;
  programId: PublicKey;
  groupPk: PublicKey;
  collateralMintPk: PublicKey;
}

/**
 * Marginfi config.
 * Aggregated data required to conveniently interact with the program
 */
export interface MarginfiConfig extends MarginfiDedicatedConfig {
  mango: MangoConfig;
  zo: ZoConfig;
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
  overrides?: Partial<Omit<MarginfiDedicatedConfig, "environment" | "mango" | "zo">>
): MarginfiDedicatedConfig {
  switch (environment) {
    case Environment.MAINNET:
      return {
        environment,
        programId: overrides?.programId || new PublicKey("mrgnfD8pJKsw4AxCDquyUBjgABNEaZ79iTLgtov2Yff"),
        groupPk: overrides?.groupPk || new PublicKey("Fp3Ytjx9XVT4Sbv78ddkBC2HtT6nomVjtAjMTZwcDcba"),
        collateralMintPk: overrides?.collateralMintPk || new PublicKey("EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v"),
      };
    case Environment.DEVNET:
      return {
        environment,
        programId: overrides?.programId || new PublicKey("mfi5YpVKT1bAJbKv7h55c6LgoTsW3LvZyRm2k811XtK"),
        groupPk: overrides?.groupPk || new PublicKey("7AYHgp3Z8AriGTVKYZ8c7GdW5m2Y3cBDacmWEuPGD2Gg"),
        collateralMintPk: overrides?.collateralMintPk || new PublicKey("8FRFC6MoGGkMFQwngccyu69VnYbzykGeez7ignHVAFSN"),
      };
    default:
      throw Error(`Unknown environment ${environment}`);
  }
}

/**
 * Retrieve
 */
export async function getConfig(
  environment: Environment,
  _connection: Connection,
  overrides?: Partial<Omit<MarginfiConfig, "environment">>
): Promise<MarginfiConfig> {
  return {
    ...getMarginfiConfig(environment, overrides),
    mango: await getMangoConfig(environment, overrides?.mango),
    zo: await getZoConfig(environment, overrides?.zo),
  };
}
