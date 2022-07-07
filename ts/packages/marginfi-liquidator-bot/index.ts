require("dotenv").config();

import "./sentry";

import { BN, ONE_I80F48, QUOTE_INDEX, sleep, ZERO_BN, ZERO_I80F48 } from "@blockworks-foundation/mango-client";
import {
  getClientFromEnv,
  MarginfiAccount,
  MarginfiAccountData,
  MarginfiClient,
  Wallet,
} from "@mrgnlabs/marginfi-client";
import { PerpOrderType, Side } from "@mrgnlabs/marginfi-client/dist/utp/mango";
import { OrderType } from "@mrgnlabs/marginfi-client/dist/utp/zo/types";
import { Connection, Keypair, PublicKey } from "@solana/web3.js";
import debugBuilder from "debug";

const connection = new Connection(process.env.RPC_ENDPOINT!, { commitment: "confirmed" });
const wallet = new Wallet(Keypair.fromSecretKey(new Uint8Array(JSON.parse(process.env.WALLET_KEY!))));
const marginfiGroupPk = new PublicKey(process.env.MARGINFI_GROUP!);
const marginfiAccountPk = new PublicKey(process.env.MARGINFI_ACCOUNT!);

(async function () {
  const debug = debugBuilder("liquidator");
  const marginClient = await getClientFromEnv();

  const marginfiGroupPk = marginClient.config.groupPk;

  debug("Starting liquidator for group %s", marginfiGroupPk);

  const marginfiAccount = await MarginfiAccount.get(marginfiAccountPk, marginClient);

  const round = async function () {
    await checkForActiveUtps(marginfiAccount);
    await processAccounts(marginClient, marginfiAccount);

    setTimeout(round, Number.parseInt(process.env.TIMEOUT!));
  };
  round();
})();

async function checkForActiveUtps(marginfiAccount: MarginfiAccount) {
  const debug = debugBuilder("liquidator:utps");
  await marginfiAccount.reload();
  if (marginfiAccount.activeUtps().length > 0) {
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
      if (await account.canBeLiquidated()) {
        await liquidate(account, marginfiAccount);
      }
    } catch (e) {
      debug("Can't verify if account liquidatable");
    }
  }
}

async function liquidate(liquidateeMarginfiAccount: MarginfiAccount, liquidatorMarginfiAccount: MarginfiAccount) {
  const debug = debugBuilder("liquidator:liquidator");

  debug("Liquidating account %s", liquidateeMarginfiAccount.publicKey);

  const utpObservations = await liquidateeMarginfiAccount.observe();
  const [balance] = await liquidatorMarginfiAccount.getBalance();
  debug("Available balance %s", balance.toNumber() / 1_000_000);

  const utp = utpObservations
    .filter((a) => a.observation.totalCollateral.lte(balance))
    .sort((a, b) => (a.observation.totalCollateral > b.observation.totalCollateral ? 1 : -1))[0];

  if (!utp) {
    debug("Can't liquidate any UTP");
    return;
  }

  debug("Liquidating UTP %s", utp.utp_index);

  await liquidatorMarginfiAccount.liquidate(liquidateeMarginfiAccount, utp.utp_index);
  await closeAllUTPs(liquidatorMarginfiAccount);
}

async function closeAllUTPs(marginfiAccount: MarginfiAccount) {
  const debug = debugBuilder("liquidator:utp");
  await marginfiAccount.reload();
  debug("Closing all UTP accounts");

  // Close all UTP positions
  if (marginfiAccount.mango.isActive) {
    await closeMango(marginfiAccount);
  }

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
  for (let sym of marketSymbols) {
    let oo = await zoMargin.getOpenOrdersInfoBySymbol(sym, false);
    let empty = !oo || (oo.coinOnAsks.isZero() && oo.coinOnBids.isZero());
    if (!empty) {
      await marginfiAccount.zo.cancelPerpOrder({ symbol: sym });
    }
  }

  /// Close positions
  debug("Closing Positions");
  for (let position of zoMargin.positions) {
    if (position.coins.number === 0) {
      continue;
    }
    await zoState.loadMarkets();

    let closeDirectionLong = !position.isLong;
    let price;
    let market = await zoState.getMarketBySymbol(position.marketKey);

    if (closeDirectionLong) {
      let asks = await market.loadAsks(connection);
      price = [...asks.items(true)][0].price;
    } else {
      let bidsOrderbook = await market.loadBids(connection);
      let bids = [...bidsOrderbook.items(true)];
      price = bids[bids.length - 1].price;
    }

    debug("Closing position on %s %s @ %s", position.coins.number, position.marketKey, price);

    let oo = await zoMargin.getOpenOrdersInfoBySymbol(position.marketKey, false);
    if (!oo) {
      await marginfiAccount.zo.createPerpOpenOrders(position.marketKey);
    }
    await marginfiAccount.zo.placePerpOrder({
      symbol: position.marketKey,
      orderType: OrderType.ReduceOnlyIoc,
      isLong: closeDirectionLong,
      price: price,
      size: position.coins.number,
    });
  }

  /// Settle funds
  for (let sym of marketSymbols) {
    let oo = await zoMargin.getOpenOrdersInfoBySymbol(sym);

    if (!oo) {
      continue;
    }

    await marginfiAccount.zo.settleFunds(sym);
  }

  let observation = await marginfiAccount.zo.observe();
  let withdrawableAmount = observation.freeCollateral.sub(new BN(100));

  debug("Withdrawing %s from ZO", bnToNumber(withdrawableAmount));
  await marginfiAccount.zo.withdraw(withdrawableAmount);

  debug("Deactivating ZO");
  await marginfiAccount.zo.deactivate();
}

async function closeMango(marginfiAccount: MarginfiAccount) {
  const debug = debugBuilder("liquidator:utp:mango");
  debug("Closing Mango positions");

  await closeMangoPositions(marginfiAccount);

  await withdrawFromMango(marginfiAccount);

  await marginfiAccount.mango.deactivate();
  debug("Deactivating mango");
  await marginfiAccount.reload();
}

async function withdrawFromMango(marginfiAccount: MarginfiAccount) {
  const debug = debugBuilder("liquidator:utp:mango:withdraw");
  debug("Trying to withdraw from Mango");
  let observation = await marginfiAccount.mango.observe();
  let withdrawAmount = observation.freeCollateral.sub(new BN(1));

  if (withdrawAmount.lte(ZERO_BN)) {
    return;
  }

  debug("Withdrawing %d from Mango", bnToNumber(withdrawAmount));
  await marginfiAccount.mango.withdraw(withdrawAmount);
}

function bnToNumber(bn: BN, decimal: number = 6): number {
  return bn.toNumber() / 10 ** decimal;
}

async function closeMangoPositions(marginfiAccount: MarginfiAccount) {
  const mangoUtp = marginfiAccount.mango;

  const debug = debugBuilder("liquidator:utp:mango");
  const mangoGroup = await mangoUtp.getMangoGroup();
  const mangoAccount = await mangoUtp.getMangoAccount(mangoGroup);

  await mangoAccount.reload(marginfiAccount.client.program.provider.connection);

  const perpMarkets = await Promise.all(
    mangoUtp.config.groupConfig.perpMarkets.map((perpMarket) => {
      return mangoGroup.loadPerpMarket(
        connection,
        perpMarket.marketIndex,
        perpMarket.baseDecimals,
        perpMarket.quoteDecimals
      );
    })
  );

  try {
    debug("Closing positions");
    await mangoAccount.reload(connection, mangoGroup.dexProgramId);
    const cache = await mangoGroup.loadCache(connection);

    for (let i = 0; i < perpMarkets.length; i++) {
      const perpMarket = perpMarkets[i];
      const index = mangoGroup.getPerpMarketIndex(perpMarket.publicKey);
      const perpAccount = mangoAccount.perpAccounts[index];
      const groupIds = mangoUtp.config.groupConfig;

      if (perpMarket && perpAccount) {
        const openOrders = await perpMarket.loadOrdersForAccount(connection, mangoAccount);

        for (const oo of openOrders) {
          debug("Canceling Perp Order %s", oo.orderId);
          await mangoUtp.cancelPerpOrder(perpMarket, oo.orderId, false);
        }

        const basePositionSize = Math.abs(perpMarket.baseLotsToNumber(perpAccount.basePosition));
        debug("%s-PERP, size %s", groupIds?.perpMarkets[i].baseSymbol, basePositionSize);
        const price = mangoGroup.getPrice(index, cache);

        if (basePositionSize != 0) {
          const side = perpAccount.basePosition.gt(ZERO_BN) ? Side.Ask : Side.Bid;
          const liquidationFee = mangoGroup.perpMarkets[index].liquidationFee;
          const orderPrice =
            side == Side.Ask
              ? price.mul(ONE_I80F48.sub(liquidationFee)).toNumber()
              : price.mul(ONE_I80F48.add(liquidationFee)).toNumber();

          debug(`${side}ing ${basePositionSize} of ${groupIds?.perpMarkets[i].baseSymbol}-PERP for $${orderPrice}`);

          await mangoUtp.placePerpOrder(perpMarket, side, orderPrice, basePositionSize, {
            orderType: PerpOrderType.Market,
            reduceOnly: true,
          });
        }

        await mangoAccount.reload(connection, mangoGroup.dexProgramId);
      }

      const rootBanks = await mangoGroup.loadRootBanks(connection);

      if (!perpAccount.quotePosition.eq(ZERO_I80F48)) {
        const quoteRootBank = rootBanks[QUOTE_INDEX];
        if (quoteRootBank) {
          debug("Settle %s-PERP, %s", groupIds?.perpMarkets[i].baseSymbol, perpAccount.quotePosition);
          const mangoClient = mangoUtp.getMangoClient();
          await mangoClient.settlePnl(
            mangoGroup,
            cache,
            mangoAccount,
            perpMarket,
            quoteRootBank,
            cache.priceCache[index].price,
            wallet.payer
          );

          await sleep(5_000);
        }
      }
    }
  } catch (err) {
    console.error("Error closing positions", err);
  }
}

async function loadAllMarginfiAccounts(mfiClient: MarginfiClient) {
  const debug = debugBuilder("liquidator:loader");
  debug("Loading marginfi accounts for group %s", marginfiGroupPk);

  const dis = { memcmp: { offset: 32 + 8, bytes: marginfiGroupPk.toBase58() } };
  const rawMarignAccounts = await mfiClient.program.account.marginfiAccount.all([dis]);

  const marginfiAccounts = rawMarignAccounts.map((a) => {
    let data: MarginfiAccountData = a.account as any;
    return MarginfiAccount.fromAccountData(a.publicKey, mfiClient, data, mfiClient.group);
  });

  debug("Loaded %d marginfi accounts", marginfiAccounts.length);

  return marginfiAccounts;
}
