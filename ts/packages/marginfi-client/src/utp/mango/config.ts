import { Config, GroupConfig, IDS } from "@blockworks-foundation/mango-client";
import { Environment, UtpConfig } from "../../types";

/**
 * Mango-specific config.
 * Aggregated data required to conveniently interact with Mango
 */
export interface MangoConfig extends UtpConfig {
  groupConfig: GroupConfig;
}

/**
 * Define Mango-specific config per profile
 *
 * @internal
 */
export async function getMangoConfig(environment: Environment, overrides?: Partial<MangoConfig>): Promise<MangoConfig> {
  switch (environment) {
    case Environment.MAINNET: {
      const mangoConfig = new Config(IDS);
      const groupConfig = mangoConfig.getGroup("mainnet", "mainnet.1")!;
      const programId = groupConfig.mangoProgramId;
      return {
        utpIndex: 0,
        programId,
        groupConfig,
        ...overrides,
      };
    }
    case Environment.DEVNET: {
      const mangoConfig = new Config(IDS);
      const groupConfig = mangoConfig.getGroup("devnet", "devnet.2")!;
      const programId = groupConfig.mangoProgramId;
      return {
        utpIndex: 0,
        programId,
        groupConfig,
        ...overrides,
      };
    }
    default:
      throw "You were never meant to be here!!";
  }
}
