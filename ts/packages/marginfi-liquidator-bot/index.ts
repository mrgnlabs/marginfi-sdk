require("dotenv").config();

import { BN, ONE_I80F48, QUOTE_INDEX, sleep, ZERO_BN, ZERO_I80F48 } from "@blockworks-foundation/mango-client";
import {
  Environment,
  getConfig,
  loadKeypair,
  MarginAccount,
  MarginAccountData,
  MarginfiClient,
  Wallet,
} from "@mrgnlabs/marginfi-client";
import { PerpOrderType, Side } from "@mrgnlabs/marginfi-client/src/utp/mango";
import { OrderType } from "@mrgnlabs/marginfi-client/src/utp/zo/types";
import { Connection, PublicKey } from "@solana/web3.js";
import debugBuilder from "debug";

const marginFiPk = new PublicKey(process.env.MARGINFI_PROGRAM!);
const connection = new Connection(process.env.RPC_ENDPOINT!);
const wallet = new Wallet(loadKeypair(process.env.WALLET!));
const marginGroupPk = new PublicKey(process.env.MARGIN_GROUP!);
const marginAccountPk = new PublicKey(process.env.MARGIN_ACCOUNT!);

(async function () {
  const debug = debugBuilder("liquidator");

  debug("Starting liquidator for group %s", marginGroupPk);
  const config = await getConfig(Environment.DEVNET, connection, {
    groupPk: marginGroupPk,
    programId: marginFiPk,
  });
  const marginClient = await MarginfiClient.get(config, wallet, connection);
  const marginAccount = await MarginAccount.get(marginAccountPk, marginClient);

  const round = async function () {
    await checkForActiveUtps(marginAccount);
    await processAccounts(marginClient, marginAccount);

    setTimeout(round, Number.parseInt(process.env.TIMEOUT!));
  };
  round();
})();

async function checkForActiveUtps(marginAccount: MarginAccount) {
  const debug = debugBuilder("liquidator:utps");
  await marginAccount.reload();
  if (marginAccount.activeUtps().length > 0) {
    debug("Margin account has active UTPs, closing...");
    await closeAllUTPs(marginAccount);
  }
}

async function processAccounts(client: MarginfiClient, marginAccount: MarginAccount) {
  const debug = debugBuilder("liquidator:loop");
  const accounts = await loadAllMarginAccounts(client);

  for (let account of accounts) {
    debug("Checking account %s", account.publicKey);
    try {
      if (await account.canBeLiquidated()) {
        await liquidate(account, marginAccount);
      }
    } catch (e) {
      debug("Can't verify if account liquidatable");
    }
  }
}

async function liquidate(liquidateeMarginAccount: MarginAccount, liquidatorMarginAccount: MarginAccount) {
  const debug = debugBuilder("liquidator:liquidator");

  debug("Liquidating account %s", liquidateeMarginAccount.publicKey);

  const utpObservations = await liquidateeMarginAccount.localObserve();
  const [balance] = await liquidatorMarginAccount.getBalance();
  debug("Available balance %s", balance.toNumber() / 1_000_000);

  const utp = utpObservations
    .filter((a) => a.observation.totalCollateral.lte(balance))
    .sort((a, b) => (a.observation.totalCollateral > b.observation.totalCollateral ? 1 : -1))[0];

  if (!utp) {
    debug("Can't liquidate any UTP");
    return;
  }

  debug("Liquidating UTP %s", utp.utp_index);

  await liquidatorMarginAccount.liquidate(liquidateeMarginAccount, utp.utp_index);
  await closeAllUTPs(liquidatorMarginAccount);
}

async function closeAllUTPs(marginAccount: MarginAccount) {
  const debug = debugBuilder("liquidator:utp");
  await marginAccount.reload();
  debug("Closing all UTP accounts");

  // Close all UTP positions
  if (marginAccount.mango.isActive) {
    await closeMango(marginAccount);
  }

  if (marginAccount.zo.isActive) {
    await closeZo(marginAccount);
  }
  // Close the UTP account
}

async function closeZo(marginAccount: MarginAccount) {
  const debug = debugBuilder("liquidator:utp:zo");
  debug("Closing Zo Positions");

  const [zoMargin, zoState] = await marginAccount.zo.getZoMarginAndState();

  /// Close open orders
  const marketSymbols = Object.keys(zoState.markets);

  debug("Cancelling Open Orders");
  for (let sym of marketSymbols) {
    let oo = await zoMargin.getOpenOrdersInfoBySymbol(sym, false);
    let empty = !oo || (oo.coinOnAsks.isZero() && oo.coinOnBids.isZero());
    if (!empty) {
      await marginAccount.zo.cancelPerpOrder({ symbol: sym });
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
      await marginAccount.zo.createPerpOpenOrders(position.marketKey);
    }
    await marginAccount.zo.placePerpOrder({
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

    await marginAccount.zo.settleFunds(sym);
  }

  let observation = await marginAccount.zo.localObserve();
  let withdrawableAmount = observation.freeCollateral.sub(new BN(100));

  debug("Withdrawing %s from ZO", bnToNumber(withdrawableAmount));
  await marginAccount.zo.withdraw(withdrawableAmount);

  debug("Deactivating ZO");
  await marginAccount.zo.deactivate();
}

async function closeMango(marginAccount: MarginAccount) {
  const debug = debugBuilder("liquidator:utp:mango");
  debug("Closing Mango positions");

  await closeMangoPositions(marginAccount);

  await withdrawFromMango(marginAccount);

  await marginAccount.mango.deactivate();
  debug("Deactivating mango");
  await marginAccount.reload();
}

async function withdrawFromMango(marginAccount: MarginAccount) {
  const debug = debugBuilder("liquidator:utp:mango:withdraw");
  debug("Trying to withdraw from Mango");
  let observation = await marginAccount.mango.localObserve();
  let withdrawAmount = observation.freeCollateral.sub(new BN(1));

  if (withdrawAmount.lte(ZERO_BN)) {
    return;
  }

  debug("Withdrawing %d from Mango", bnToNumber(withdrawAmount));
  await marginAccount.mango.withdraw(withdrawAmount);
}

function bnToNumber(bn: BN, decimal: number = 6): number {
  return bn.toNumber() / 10 ** decimal;
}

async function closeMangoPositions(marginAccount: MarginAccount) {
  const mangoUtp = marginAccount.mango;

  const debug = debugBuilder("liquidator:utp:mango");
  let mangoGroup = mangoUtp._config.mango.group;
  const [mangoClient, mangoAccount] = await mangoUtp.getMangoClientAndAccount();

  await mangoAccount.reload(marginAccount.client.program.provider.connection);

  const perpMarkets = await Promise.all(
    mangoUtp._config.mango.groupConfig.perpMarkets.map((perpMarket) => {
      return mangoUtp._config.mango.group.loadPerpMarket(
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
      const groupIds = mangoUtp._config.mango.groupConfig;

      if (perpMarket && perpAccount) {
        const openOrders = await perpMarket.loadOrdersForAccount(connection, mangoAccount);

        for (const oo of openOrders) {
          // await client.cancelPerpOrder(
          //   mangoGroup,
          //   mangoAccount,
          //   payer,x
          //   perpMarket,
          //   oo,
          // );
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

          // await client.placePerpOrder(
          //   mangoGroup,
          //   mangoAccount,
          //   cache.publicKey,
          //   perpMarket,
          //   payer,
          //   side,
          //   orderPrice,
          //   basePositionSize,
          //   'ioc',
          //   0,
          //   bookSideInfo ? bookSideInfo : undefined,
          //   true,
          // );
        }

        await mangoAccount.reload(connection, mangoGroup.dexProgramId);
      }

      const rootBanks = await mangoGroup.loadRootBanks(connection);

      if (!perpAccount.quotePosition.eq(ZERO_I80F48)) {
        const quoteRootBank = rootBanks[QUOTE_INDEX];
        if (quoteRootBank) {
          debug("Settle %s-PERP, %s", groupIds?.perpMarkets[i].baseSymbol, perpAccount.quotePosition);
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

async function loadAllMarginAccounts(mfiClient: MarginfiClient) {
  const debug = debugBuilder("liquidator:loader");
  debug("Loading margin accounts for group %s", marginGroupPk);

  const dis = { memcmp: { offset: 32 + 8, bytes: marginGroupPk.toBase58() } };
  const rawMarignAccounts = await mfiClient.program.account.marginAccount.all([dis]);

  const marginAccounts = rawMarignAccounts.map((a) => {
    let data: MarginAccountData = a.account as any;
    return MarginAccount.fromAccountData(a.publicKey, mfiClient, data, mfiClient.group);
  });

  debug("Loaded %d margin accounts", marginAccounts.length);

  return marginAccounts;
}
