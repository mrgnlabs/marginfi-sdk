require("dotenv").config();

import { captureException } from "./sentry";

import {
  EquityType,
  MangoOrderSide,
  MangoPerpOrderType,
  MarginfiAccount,
  MarginfiAccountData,
  MarginfiClient,
  MarginRequirementType,
  ZoPerpOrderType,
} from "@mrgnlabs/marginfi-client";
import { PublicKey } from "@solana/web3.js";
import BigNumber from "bignumber.js";

const marginfiGroupPk = new PublicKey(process.env.MARGINFI_GROUP!);

(async function () {
  console.log("Running crank bot, use DEBUG=* to see logs");
  const debug = require("debug")("crank-bot");
  debug("Running crank bot for group %s", marginfiGroupPk);
  const marginClient = await MarginfiClient.fromEnv();
  const round = async function () {
    try {
      await loadAllMarginfiAccounts(marginClient);
    } catch (e) {
      captureException(e);
      debug("Bot crashed");
      debug(e);
    } finally {
      let n = Number.parseInt(process.env.TIMEOUT!);
      debug("Sleeping %d", n);
      setTimeout(round, n);
    }
  };
  round();
})();

async function loadAllMarginfiAccounts(mfiClient: MarginfiClient) {
  const debug = require("debug")("crank-bot:loader");
  debug("Loading marginfi accounts for group %s", marginfiGroupPk);

  const dis = { memcmp: { offset: 32 + 8, bytes: marginfiGroupPk.toBase58() } };
  const rawMarignAccounts = await mfiClient.program.account.marginfiAccount.all([dis]);

  const marginfiAccounts = rawMarignAccounts.map((a) => {
    let data: MarginfiAccountData = a.account as any;
    return MarginfiAccount.fromAccountData(a.publicKey, mfiClient, data, mfiClient.group);
  });

  debug("Loaded %d marginfi accounts", marginfiAccounts.length);

  for (let marginfiAccount of marginfiAccounts) {
    await marginfiAccount.group.fetch();
    try {
      await marginfiAccount.reload(true);
      // await marginfiAccount.checkRebalance();
      // await marginfiAccount.checkBankruptcy();
      await checkPartialLiq(marginfiAccount);
    } catch (e: any) {
      captureException(e, {
        user: { id: marginfiAccount.publicKey.toBase58() },
        extra: { errorCode: e?.logs?.at(-1)?.split(" ")?.at(-1) },
      });
      debug("Bot crashed");
      debug(e);
    }
  }
}

async function checkPartialLiq(mfiAccount: MarginfiAccount) {
  if (mfiAccount.meetsMarginRequirement(MarginRequirementType.PartialLiquidation)) {
    return;
  }
  const debug = require("debug")("crank-bot:partial-liquidation");
  const connection = mfiAccount.client.program.provider.connection;

  const marginRequirement = await mfiAccount.computeMarginRequirement(MarginRequirementType.PartialLiquidation);
  const { equity } = await mfiAccount.computeBalances(EquityType.InitReqAdjusted);

  const maxLiqAmountUsd = marginRequirement.minus(equity).multipliedBy(0.5);

  // Find biggest position;
  const positions: { utpIndex: number; value: number; market: any }[] = [];

  if (mfiAccount.mango.isActive) {
    debug("Checking Mango Markets positions");
    const mangoGroup = await mfiAccount.mango.getMangoGroup();
    const mangoAccount = await mfiAccount.mango.getMangoAccount(mangoGroup);
    const mangoCache = await mangoGroup.loadCache(connection);

    for (let i = 0; i < mfiAccount.mango.config.groupConfig.perpMarkets.length; i++) {
      const perpMarketConfig = mfiAccount.mango.config.groupConfig.perpMarkets[i];
      const marketPrice = await mangoGroup.getPriceUi(perpMarketConfig.marketIndex, mangoCache);
      const perpMarket = await mangoGroup.loadPerpMarket(
        connection,
        perpMarketConfig.marketIndex,
        perpMarketConfig.baseDecimals,
        perpMarketConfig.quoteDecimals
      );
      const positionSize = await mangoAccount.getPerpPositionUi(i, perpMarket);
      const positionNotionalValue = Math.abs(positionSize * marketPrice);

      debug("Adding position $%s on %s", positionNotionalValue, perpMarketConfig.name);

      positions.push({
        utpIndex: mfiAccount.mango.config.utpIndex,
        value: positionNotionalValue,
        market: i,
      });
    }
  }

  if (mfiAccount.zo.isActive) {
    debug("Checking 01 Protocol positions");
    const zoState = await mfiAccount.zo.getZoState();
    const zoMargin = await mfiAccount.zo.getZoMargin(zoState);

    await zoMargin.loadPositions();
    await zoState.loadMarkets(true);

    for (let i = 0; i < zoMargin.positions.length; i++) {
      const position = zoMargin.positions[i];
      const zoMarket = await zoState.getMarketBySymbol(position.marketKey);
      const price = position.isLong
        ? (await zoMarket.loadAsks(connection)).getL2(1)[0][0]
        : (await zoMarket.loadBids(connection)).getL2(1)[0][0];
      const positionNotionalValue = position.coins.mul(price);

      positions.push({
        utpIndex: mfiAccount.zo.config.utpIndex,
        value: positionNotionalValue.number,
        market: position.marketKey,
      });
    }
  }

  const biggestPosition = positions
    .filter((a) => a.value > 0)
    .sort((a, b) => a.value - b.value)
    .at(0);

  if (!biggestPosition) {
    debug("No position found!");
    return;
  }

  if (biggestPosition.utpIndex === mfiAccount.mango.config.utpIndex) {
    const mangoGroup = await mfiAccount.mango.getMangoGroup();
    const mangoAccount = await mfiAccount.mango.getMangoAccount(mangoGroup);
    const mangoCache = await mangoGroup.loadCache(connection);

    const perpMarketConfig = mfiAccount.mango.config.groupConfig.perpMarkets[biggestPosition.market];
    const perpMarket = await mangoGroup.loadPerpMarket(
      connection,
      biggestPosition.market,
      perpMarketConfig.baseDecimals,
      perpMarketConfig.quoteDecimals
    );
    const marketPrice = await mangoGroup.getPriceUi(perpMarketConfig.marketIndex, mangoCache);
    const positionSize = mangoAccount.getPerpPositionUi(biggestPosition.market, perpMarket);
    const size = BigNumber.min(new BigNumber(positionSize).abs(), maxLiqAmountUsd.div(marketPrice));
    const side = positionSize > 0 ? MangoOrderSide.Ask : MangoOrderSide.Bid;

    if (size.times(marketPrice).abs().lte(1)) {
      debug("Size %s under dust threshold, skipping...", size.times(marketPrice).abs());
      return;
    }

    debug("Placing a %s order for %s @ $%s for %s on Mango Markets", side, size, marketPrice, perpMarketConfig.name);

    mfiAccount.mango.placePerpOrder(perpMarket, side, marketPrice, size, {
      orderType: MangoPerpOrderType.Market,
      reduceOnly: true,
    });
  }

  if (biggestPosition.utpIndex === mfiAccount.zo.config.utpIndex) {
    const zoState = await mfiAccount.zo.getZoState();
    const zoMargin = await mfiAccount.zo.getZoMargin(zoState);

    await zoMargin.loadPositions();
    await zoState.loadMarkets(true);

    const position = zoMargin.position(biggestPosition.market);
    const zoMarket = await zoState.getMarketBySymbol(position.marketKey);
    const long = position.isLong;
    const price = long
      ? (await zoMarket.loadAsks(connection)).getL2(1)[0][0]
      : (await zoMarket.loadBids(connection)).getL2(1)[0][0];

    const size = BigNumber.min(new BigNumber(position.coins.number).abs(), maxLiqAmountUsd.div(price));

    if (size.times(price).abs().lte(1)) {
      debug("Size %s under dust threshold, skipping...", size.times(price).abs());
      return;
    }

    debug(
      "Placing a %s order for %s @ $%s for %s on 01 Protocol",
      long ? "LONG" : "SHORT",
      size,
      price,
      position.marketKey
    );

    mfiAccount.zo.placePerpOrder({
      symbol: position.marketKey,
      isLong: long,
      price: price,
      orderType: ZoPerpOrderType.ReduceOnlyIoc,
      size: size.toNumber(),
    });
  }
}
