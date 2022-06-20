import { getClientFromEnv, MarginfiAccount, MarginRequirementType } from "@mrgnlabs/marginfi-client";
import { PublicKey } from "@solana/web3.js";

export async function getAccount(accountPk: string) {
  try {
    const client = await getClientFromEnv();
    const account = await MarginfiAccount.get(new PublicKey(accountPk), client);

    const balances = await account.getBalance();
    const [equity, assets, liabilities] = balances.map((n) => n.toNumber() / 1_000_000);
    const utps = account.allUtps();
    const observations = await account.observe();

    console.log(
      "Marginfi account %s\n\tBalance %s,\n\tAssets: %s,\n\tLiabilities: %s",
      accountPk,
      equity,
      assets,
      liabilities
    );
    for (let utp of utps) {
      console.log("Utp %s active: %s, address %s", utp.index, utp.isActive, utp.address);
    }
    for (let observation of observations) {
      console.log(
        "Utp Observation: %d, equity: %s, free collateral: %s, assets: %s, init margin req: %s, valid %s",
        observation.utp_index,
        observation.observation.equity.toNumber() / 1_000_000,
        observation.observation.freeCollateral.toNumber() / 1_000_000,
        observation.observation.totalCollateral.toNumber() / 1_000_000,
        observation.observation.marginRequirementInit.toNumber() / 1_000_000,
        observation.observation.valid,
      );
    }

    const marginRequirementInit = await account.getMarginRequirement(MarginRequirementType.Init);
    const marginRequirementMaint = await account.getMarginRequirement(MarginRequirementType.Maint);

    const initHealth = equity / marginRequirementInit.toNumber();
    const maintHealth = equity / marginRequirementMaint.toNumber();

    const marginRatio = equity / liabilities;

    console.log(
      "-----------------\nMargin \tratio: %s\n\trequirement\n\tinit: %s, health: %s\n\tmaint: %s, health: %s",
      marginRatio,
      marginRequirementInit,
      initHealth,
      marginRequirementMaint,
      maintHealth
    );
  } catch (e) {
    console.log("Observation failed because of invalid on-chain data");
    console.log(e);
  }
}
