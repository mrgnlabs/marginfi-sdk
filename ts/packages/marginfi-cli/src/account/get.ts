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
    const account = await MarginfiAccount.fetch(
      new PublicKey(accountPk || new PublicKey(process.env.MARGINFI_ACCOUNT!)),
      client
    );
    await account.observeUtps();
    console.log(account);
    if (account.activeUtps.length > 0) {
      console.log("------------------\nUTP details:");
    }

    if (account.mango.isActive) {
      console.log("> Mango Markets");
      console.log("Mango markets is no longer supported, please deactivate it.");
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
