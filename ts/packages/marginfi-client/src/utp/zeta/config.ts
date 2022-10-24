import { PublicKey } from "@solana/web3.js";
import { constants as zetaConstants, Network as ZetaNetwork, utils as zetaUtils } from "@zetamarkets/sdk";
import { Asset } from "@zetamarkets/sdk/dist/assets";
import { Environment } from "../../types";

export interface ZetaConfig {
  network: ZetaNetwork;
  utpIndex: number;
  programId: PublicKey;
  dexPid: PublicKey;
  priceFeeds: { [feedName: string]: PublicKey };
  groupPk: PublicKey;
  vaultPk: PublicKey;
  socializedLossAccountPk: PublicKey;
  statePk: PublicKey;
  greeksPk: PublicKey;
  serumAuthorityPk: PublicKey;
  mintAuthorityPk: PublicKey;
}

export async function getZetaConfig(environment: Environment, overrides?: Partial<ZetaConfig>): Promise<ZetaConfig> {
  switch (environment) {
    case Environment.MAINNET: {
      const programId = new PublicKey("ZETAxsqBRek56DhiGXrn75yj2NHU3aYUnxvHXpkf3aD");
      const [groupPk] = await zetaUtils.getZetaGroup(programId, zetaConstants.MINTS[Asset.SOL]); // TODO: need to find asset from group associated with UTP account
      const [vaultPk] = await zetaUtils.getVault(programId, groupPk);
      const [socializedLossAccountPk] = await zetaUtils.getSocializedLossAccount(programId, groupPk);
      const [statePk] = await zetaUtils.getState(programId);
      const [greeksPk] = await zetaUtils.getGreeks(programId, groupPk);
      const [serumAuthorityPk] = await zetaUtils.getSerumAuthority(programId);
      const [mintAuthorityPk] = await zetaUtils.getMintAuthority(programId);
      return {
        network: ZetaNetwork.DEVNET,
        utpIndex: 2,
        programId,
        dexPid: zetaConstants.DEX_PID[ZetaNetwork.DEVNET],
        priceFeeds: zetaConstants.PYTH_PRICE_FEEDS[ZetaNetwork.DEVNET],
        groupPk,
        vaultPk,
        socializedLossAccountPk,
        statePk,
        greeksPk,
        serumAuthorityPk,
        mintAuthorityPk,
        ...overrides,
      };
    }
    case Environment.DEVNET: {
      const programId = new PublicKey("BG3oRikW8d16YjUEmX3ZxHm9SiJzrGtMhsSR8aCw1Cd7");
      const [groupPk] = await zetaUtils.getZetaGroup(programId, zetaConstants.MINTS[Asset.SOL]);
      const [vaultPk] = await zetaUtils.getVault(programId, groupPk);
      const [socializedLossAccountPk] = await zetaUtils.getSocializedLossAccount(programId, groupPk);
      const [statePk] = await zetaUtils.getState(programId);
      const [greeksPk] = await zetaUtils.getGreeks(programId, groupPk);
      const [serumAuthorityPk] = await zetaUtils.getSerumAuthority(programId);
      const [mintAuthorityPk] = await zetaUtils.getMintAuthority(programId);
      return {
        network: ZetaNetwork.DEVNET,
        utpIndex: 2,
        programId,
        dexPid: zetaConstants.DEX_PID[ZetaNetwork.DEVNET],
        priceFeeds: zetaConstants.PYTH_PRICE_FEEDS[ZetaNetwork.DEVNET],
        groupPk,
        vaultPk,
        socializedLossAccountPk,
        statePk,
        greeksPk,
        serumAuthorityPk,
        mintAuthorityPk,
        ...overrides,
      };
    }
    default:
      throw "You were never meant to be here!!";
  }
}
