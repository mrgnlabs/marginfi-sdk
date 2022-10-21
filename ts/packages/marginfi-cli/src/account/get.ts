import { MarginfiAccount } from "@mrgnlabs/marginfi-client";
import { PublicKey } from "@solana/web3.js";
import { OptionValues } from "commander";
import { getClientFromOptions } from "../common";

export async function getAccounts(options: OptionValues) {
  const client = await getClientFromOptions(options);
  const accounts = await await client.getOwnMarginfiAccounts();
  if (accounts.length > 0) {
    console.log("%s accounts owned by %s:\n", accounts.length, client.provider.wallet.publicKey);
  } else {
    console.log("No accounts owned by %s", client.provider.wallet.publicKey);
  }
  for (let account of accounts) {
    console.log("%s", account.publicKey);
  }
}

export async function getAccount(accountPk: string, options: OptionValues) {
  const client = await getClientFromOptions(options);
  try {
    const connection = client.program.provider.connection;
    const account = await MarginfiAccount.fetch(new PublicKey(accountPk), client);
    await account.observeUtps();
    console.log(account);
    if (account.activeUtps.length > 0) {
      console.log("------------------\nUTP details:");
    }

    if (account.mango.isActive) {
      const mangoGroup = await account.mango.getMangoGroup();
      const mangoAccount = await account.mango.getMangoAccount(mangoGroup);
      const mangoGroupConfig = account.mango.config.groupConfig;
      const mangoCache = await mangoGroup.loadCache(connection);

      console.log("> Mango Markets");
      console.log("  Perp markets:");
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
            console.log("    %s - position: %s", mangoGroupConfig.perpMarkets[perpMarketIndex].name, position);
          }
        } catch (e) {
          console.log("    Could not load the perp market %s", mangoGroupConfig.perpMarkets[perpMarketIndex].name);
        }

        const oo = await mangoAccount.getPerpOpenOrders().filter((a) => a.marketIndex === perpMarketIndex);
        for (let o of oo) {
          console.log("      Open order: side %s price %s", o.side, o.price.toNumber());
        }
      }
    }

    if (account.zo.isActive) {
      console.log("> 01 Protocol");

      const zoState = await account.zo.getZoState();
      const zoMargin = await account.zo.getZoMargin(zoState);
      console.log("  Perp Markets");
      for (let pos of zoMargin.positions) {
        if (pos.coins.number != 0) {
          console.log("    %s - position %s", pos.marketKey, pos.isLong ? pos.coins : -1 * pos.coins.number);
        }
      }

      for (let market of Object.keys(zoState.markets)) {
        const oo = await zoMargin.getOpenOrdersInfoBySymbol(market);
        if (oo && (!oo.coinOnAsks.isZero() || !oo.coinOnBids.isZero())) {
          console.log(
            "    Open order for %s asks: %s bids: %s, count: %s",
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
