import {
  Environment,
  getConfig,
  getMfiProgram,
  loadKeypair,
  MarginfiAccount,
  MarginfiClient,
  MarginRequirementType,
  Wallet,
} from "@mrgnlabs/marginfi-client";
import { Connection, PublicKey } from "@solana/web3.js";
import { OptionValues } from "commander";

const wallet = new Wallet(loadKeypair(process.env.WALLET!));
const program = getMfiProgram(
  new PublicKey(process.env.MARGINFI_PROGRAM!),
  new Connection(process.env.RPC_ENDPOINT!),
  wallet
);

export async function getAccount(accountPk: string, options: OptionValues) {
  try {
    const connection = program.provider.connection;
    const config = await getConfig(Environment.DEVNET, connection, {
      groupPk: new PublicKey(options.group),
      programId: program.programId,
    });
    const client = await MarginfiClient.get(config, wallet, connection);
    const account = await MarginfiAccount.get(new PublicKey(accountPk), client);

    const balances = await account.getBalance();
    const [equity, assets, liabilities] = balances.map((n) => n.toNumber() / 1_000_000);
    const utps = account.allUtps();
    const observations = await account.localObserve();

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
        "Utp Observation: %d, equity: %s, free collateral: %s, assets: %s, margin req: %s",
        observation.utp_index,
        observation.observation.equity.toNumber() / 1_000_000,
        observation.observation.freeCollateral.toNumber() / 1_000_000,
        observation.observation.totalCollateral.toNumber() / 1_000_000,
        observation.observation.marginRequirementInit.toNumber() / 1_000_000
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
