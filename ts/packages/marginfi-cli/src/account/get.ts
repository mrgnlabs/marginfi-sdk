import { MarginfiAccount, MarginRequirementType } from "@mrgnlabs/marginfi-client";
import { PublicKey } from "@solana/web3.js";
import { OptionValues } from "commander";
import { getClientFromOptions } from "../common";

export async function getAccounts(options: OptionValues) {
  const client = await getClientFromOptions(options);
  const accounts = await await client.getOwnMarginfiAccounts();
  if (accounts.length > 0) {
    console.log("%s accounts owned by %s:\n", accounts.length, client.program.provider.wallet.publicKey);
  } else {
    console.log("No accounts owned by %s", client.program.provider.wallet.publicKey);
  }
  for (let account of accounts) {
    console.log("%s", account.publicKey);
  }
}

export async function getAccount(accountPk: string, options: OptionValues) {
  const client = await getClientFromOptions(options);
  try {
    const connection = client.program.provider.connection;
    const account = await MarginfiAccount.get(new PublicKey(accountPk), client);
    await account.observeUtps();

    let { assets, equity, liabilities } = await account.computeBalances();
    const deposits = await account.deposits;

    // const utps = account.allUtps;
    // const observations = await account.observeUtps();

    console.log(
      "Marginfi account %s\n\tGA Balance: %s\n\tEquity: %s,\n\tAssets: %s,\n\tLiabilities: %s",
      accountPk,
      deposits,
      equity,
      assets,
      liabilities
    );
    // for (let utp of utps) {
    //   console.log("Utp %s active: %s, address %s", utp.index, utp.isActive, utp.address);
    // }
    // for (let observation of observations) {
    //   console.log(
    //     "Utp Observation: %d, equity: %s, free collateral: %s, assets: %s, init margin req: %s, valid %s",
    //     observation.utp_index,
    //     observation.observation.equity.toNumber() / 1_000_000,
    //     observation.observation.freeCollateral.toNumber() / 1_000_000,
    //     observation.observation.totalCollateral.toNumber() / 1_000_000,
    //     observation.observation.marginRequirementInit.toNumber() / 1_000_000,
    //     observation.observation.valid
    //   );
    // }

    const marginRequirementInit = await account.computeMarginRequirement(MarginRequirementType.Init);
    const marginRequirementMaint = await account.computeMarginRequirement(MarginRequirementType.Maint);

    const initHealth = marginRequirementInit.toNumber() <= 0 ? Infinity : equity.div(marginRequirementInit.toNumber());
    const maintHealth =
      marginRequirementMaint.toNumber() <= 0 ? Infinity : equity.div(marginRequirementMaint.toNumber());
    const marginRatio = liabilities.lte(0) ? Infinity : equity.div(liabilities);

    console.log(
      "-----------------\nMargin \tratio: %s\n\trequirement\n\tinit: %s, health: %s\n\tmaint: %s, health: %s",
      marginRatio,
      marginRequirementInit,
      initHealth,
      marginRequirementMaint,
      maintHealth
    );

    if (account.mango.isActive) {
      const mangoGroup = await account.mango.getMangoGroup();
      const mangoAccount = await account.mango.getMangoAccount(mangoGroup);
      const mangoGroupConfig = account.mango.config.groupConfig;
      const mangoCache = await mangoGroup.loadCache(connection);
      const mangoEquity = mangoAccount.getEquityUi(mangoGroup, mangoCache) * 10 ** 6;
      const mangoFC = mangoAccount.getCollateralValueUi(mangoGroup, mangoCache);

      console.log("------------------");
      console.log("Mango Markets");
      console.log("Account %s\n\tEquity: %s\n\tFree Collateral: %s", accountPk, mangoEquity, mangoFC);

      console.log("Perp markets:");
      for (let perpMarketIndex = 0; perpMarketIndex < mangoCache.perpMarketCache.length; perpMarketIndex++) {
        try {
          if (!mangoGroupConfig.perpMarkets[perpMarketIndex]) {
            continue;
          }
          const perpMarket = await mangoGroup.loadPerpMarket(
            connection,
            perpMarketIndex,
            mangoGroupConfig.perpMarkets[perpMarketIndex].baseDecimals,
            mangoGroupConfig.perpMarkets[perpMarketIndex].quoteDecimals
          );
          const position = await mangoAccount.getPerpPositionUi(perpMarketIndex, perpMarket);
          if (position != 0) {
            console.log("\t%s - position: %s", mangoGroupConfig.perpMarkets[perpMarketIndex].name, position);
          }
        } catch (e) {
          console.log("\tCould not load the perp market %s", mangoGroupConfig.perpMarkets[perpMarketIndex].name);
        }

        const oo = await mangoAccount.getPerpOpenOrders().filter((a) => a.marketIndex === perpMarketIndex);
        for (let o of oo) {
          console.log("\tOpen order: side %s price %s", o.side, o.price.toNumber());
        }
      }
    }

    if (account.zo.isActive) {
      console.log("------------------");
      console.log("01 Protocol");
      console.log(
        "Account %s\n\tEquity: %s\n\tFree Collateral: %s",
        account.zo.address,
        account.zo.equity,
        account.zo.freeCollateral
      );

      const zoState = await account.zo.getZoState();
      const zoMargin = await account.zo.getZoMargin(zoState);
      console.log("Perp Markets");
      for (let pos of zoMargin.positions) {
        if (pos.coins.number != 0) {
          console.log("\t%s - position %s", pos.marketKey, pos.isLong ? pos.coins : -1 * pos.coins.number);
        }
      }

      for (let market of Object.keys(zoState.markets)) {
        const oo = await zoMargin.getOpenOrdersInfoBySymbol(market);
        if (oo && (!oo.coinOnAsks.isZero() || !oo.coinOnBids.isZero())) {
          console.log(
            "Open order for %s asks: %s bids: %s, count: %s",
            market,
            oo.coinOnAsks,
            oo.coinOnBids,
            oo.orderCount
          );
        }
      }
    }
  } catch (e) {
    console.log("Something went wrong: %s", e);
  }
}
