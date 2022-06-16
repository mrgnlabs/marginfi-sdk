import { Connection, PublicKey } from "@solana/web3.js";
import { getMangoConfig, MangoConfig } from "./utp/mango/config";
import { getZoConfig, ZoConfig } from "./utp/zo";

/**
 * Supported config environments.
 */
export enum Environment {
  DEVNET = "devnet",
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
  if (environment == Environment.DEVNET) {
    return {
      environment,
      programId: overrides?.programId || new PublicKey("7zqRtgBNVth1BANGUV8tv5R62Ub6pUaZfpU6RP5X7yZY"),
      groupPk: overrides?.groupPk || new PublicKey("HoFKnT1ytBd9ozoGkUM4Crzf9D6f5zuisQvJDKR74i4H"),
      collateralMintPk: overrides?.collateralMintPk || new PublicKey("7UT1javY6X1M9R2UrPGrwcZ78SX3huaXyETff5hm5YdX"),
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
  overrides?: Partial<Omit<MarginfiConfig, "environment">>
): Promise<MarginfiConfig> {
  if (environment == Environment.DEVNET) {
    return {
      ...getMarginfiConfig(environment, overrides),
      mango: await getMangoConfig(environment, connection, overrides?.mango),
      zo: await getZoConfig(environment, connection, overrides?.zo),
    };
  } else {
    throw Error(`Unknown environment ${environment}`);
  }
}
