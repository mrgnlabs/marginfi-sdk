require("dotenv").config();

import "./sentry";

import {
  DUST_THRESHOLD,
  loadKeypair,
  MarginfiAccount,
  MarginfiAccountData,
  MarginfiClient,
  NodeWallet,
  ZoPerpOrderType,
} from "@mrgnlabs/marginfi-client";
import { Connection, Keypair, PublicKey } from "@solana/web3.js";
import debugBuilder from "debug";
import { captureException } from "./sentry";

const connection = new Connection(process.env.RPC_ENDPOINT!, { commitment: "confirmed" });
const wallet = new NodeWallet(
  process.env.WALLET_KEY
    ? Keypair.fromSecretKey(new Uint8Array(JSON.parse(process.env.WALLET_KEY)))
    : loadKeypair(process.env.WALLET!)
);
const marginfiGroupPk = new PublicKey(process.env.MARGINFI_GROUP!);
const marginfiAccountPk = new PublicKey(process.env.MARGINFI_ACCOUNT!);

(async function () {
  const debug = debugBuilder("liquidator");
  const marginClient = await MarginfiClient.fromEnv({ wallet, connection });

  const marginfiGroupPk = marginClient.config.groupPk;

  debug("Starting liquidator for group %s", marginfiGroupPk);

  const marginfiAccount = await MarginfiAccount.fetch(marginfiAccountPk, marginClient);

  const round = async function () {
    try {
      await checkForActiveUtps(marginfiAccount);
      await processAccounts(marginClient, marginfiAccount);
    } catch (e: any) {
      debug("Error in liquidator: %s", e);

      captureException(e, {
        extra: { errorCode: e?.logs?.at(-1)?.split(" ")?.at(-1) },
      });
    }

    setTimeout(round, Number.parseInt(process.env.TIMEOUT!));
  };
  round();
})();

async function checkForActiveUtps(marginfiAccount: MarginfiAccount) {
  const debug = debugBuilder("liquidator:utps");
  await marginfiAccount.reload();
  if (marginfiAccount.activeUtps.length > 0) {
    debug("Marginfi account has active UTPs, closing...");
    await closeAllUTPs(marginfiAccount);
  }
}

async function processAccounts(client: MarginfiClient, marginfiAccount: MarginfiAccount) {
  const debug = debugBuilder("liquidator:loop");
  const accounts = await loadAllMarginfiAccounts(client);

  for (let account of accounts) {
    debug("Checking account %s", account.publicKey);
    try {
      await account.reload(true);
      if (account.canBeLiquidated()) {
        await liquidate(account, marginfiAccount);
      }
    } catch (e: any) {
      captureException(e, {
        user: { id: account.publicKey.toBase58() },
        extra: { errorCode: e?.logs?.at(-1)?.split(" ")?.at(-1) },
      });
      debug("Error in liquidator: %s", e);
      debug("Can't verify if account liquidatable");
    }
  }
}

async function liquidate(liquidateeMarginfiAccount: MarginfiAccount, liquidatorMarginfiAccount: MarginfiAccount) {
  const debug = debugBuilder("liquidator:liquidator");

  debug("Liquidating account %s", liquidateeMarginfiAccount.publicKey);

  const { equity: liquidatorEquity } = await liquidatorMarginfiAccount.computeBalances();
  debug("Available balance $%s", liquidatorEquity.toFixed(4));

  const affordableUtps = liquidateeMarginfiAccount.activeUtps.filter((utp) =>
    utp.computeLiquidationPrices().discountedLiquidatorPrice.lte(liquidatorEquity)
  );
  const cheapestUtp = affordableUtps
    .sort((utp1, utp2) =>
      utp1
        .computeLiquidationPrices()
        .discountedLiquidatorPrice.minus(utp2.computeLiquidationPrices().discountedLiquidatorPrice)
        .toNumber()
    )
    .at(0);

  if (!cheapestUtp) {
    console.log("Insufficient balance to liquidate any UTP");
    return;
  }

  debug("Liquidating UTP %s", cheapestUtp.index);

  await liquidatorMarginfiAccount.liquidate(liquidateeMarginfiAccount, cheapestUtp.index);
  await closeAllUTPs(liquidatorMarginfiAccount);
}

async function closeAllUTPs(marginfiAccount: MarginfiAccount) {
  const debug = debugBuilder("liquidator:utp");
  await marginfiAccount.reload();
  debug("Closing all UTP accounts");

  if (marginfiAccount.zo.isActive) {
    await closeZo(marginfiAccount);
  }
  // Close the UTP account
}

async function closeZo(marginfiAccount: MarginfiAccount) {
  const debug = debugBuilder("liquidator:utp:zo");
  debug("Closing Zo Positions");

  const zoState = await marginfiAccount.zo.getZoState();
  const zoMargin = await marginfiAccount.zo.getZoMargin(zoState);

  /// Close open orders
  const marketSymbols = Object.keys(zoState.markets);

  debug("Cancelling Open Orders");
  await zoMargin.loadOrders();
  for (let order of zoMargin.orders) {
    await marginfiAccount.zo.cancelPerpOrder({
      symbol: order.symbol,
      orderId: order.orderId,
      isLong: order.long,
    });
  }

  /// Close positions
  debug("Closing Positions");
  for (let position of zoMargin.positions) {
    if (position.coins.number === 0) {
      continue;
    }
    await zoState.loadMarkets();

    let closeDirectionLong = !position.isLong;
    debug("Market closing position on %s %s @ %s", position.coins.number, position.marketKey);

    let oo = await zoMargin.getOpenOrdersInfoBySymbol(position.marketKey, false);
    if (!oo) {
      await marginfiAccount.zo.createPerpOpenOrders(position.marketKey);
    }
    await marginfiAccount.zo.placePerpOrder({
      symbol: position.marketKey,
      orderType: ZoPerpOrderType.ReduceOnlyIoc,
      isLong: closeDirectionLong,
      price: closeDirectionLong ? 1_000_000 : 0.0001,
      size: position.coins.number,
    });
  }

  /// Settle funds
  for (let symbol of marketSymbols) {
    let oo = await zoMargin.getOpenOrdersInfoBySymbol(symbol);

    if (!oo) {
      continue;
    }

    await marginfiAccount.zo.settleFunds(symbol);
  }

  const observation = await marginfiAccount.zo.observe();
  let withdrawableAmount = observation.freeCollateral.minus(0.0001);

  if (withdrawableAmount.gte(DUST_THRESHOLD)) {
    debug("Withdrawing %s from ZO", withdrawableAmount.toString());
    await marginfiAccount.zo.withdraw(withdrawableAmount);
  }

  debug("Deactivating ZO");
  await marginfiAccount.zo.deactivate();
}

async function loadAllMarginfiAccounts(mfiClient: MarginfiClient) {
  const debug = debugBuilder("liquidator:loader");
  debug("Loading marginfi accounts for group %s", marginfiGroupPk);

  const dis = { memcmp: { offset: 32 + 8, bytes: marginfiGroupPk.toBase58() } };
  const rawMarignAccounts = await mfiClient.program.account.marginfiAccount.all([dis]);

  const marginfiAccounts = rawMarignAccounts
    .map((a) => {
      let data: MarginfiAccountData = a.account as any;
      return MarginfiAccount.fromAccountData(a.publicKey, mfiClient, data, mfiClient.group);
    })
    .filter((a) => a.borrows.gt(0));

  debug("Loaded %d marginfi accounts with liabilities", marginfiAccounts.length);

  return marginfiAccounts;
}
