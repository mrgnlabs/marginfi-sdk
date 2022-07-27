import { Connection, PublicKey } from "@solana/web3.js";
import { Environment, MarginfiConfig, MarginfiDedicatedConfig } from "./types";
import { getMangoConfig } from "./utp/mango/config";
import { getZoConfig } from "./utp/zo";

/**
 * Define marginfi-specific config per profile
 *
 * @internal
 */
function getMarginfiConfig(
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
        programId: overrides?.programId || new PublicKey("mf2tjVmwcxgNfscvVNdN9t2LZ8YwPkNQabeTzyYw2Hn"),
        groupPk: overrides?.groupPk || new PublicKey("GoAzFyYE1xRsbT4C5MHJh8hBd5s6Jks9j4hLrtWR3pba"),
        collateralMintPk: overrides?.collateralMintPk || new PublicKey("8FRFC6MoGGkMFQwngccyu69VnYbzykGeez7ignHVAFSN"),
      };
    default:
      throw Error(`Unknown environment ${environment}`);
  }
}

/**
 * Retrieve config per environment
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
