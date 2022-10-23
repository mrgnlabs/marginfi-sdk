require("dotenv").config();

import { captureException } from "./sentry";

import {
  EquityType,
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
    try {
      await marginfiAccount.reload(true);

      await marginfiAccount.checkRebalance();
      await checkPartialLiqCloseOpenOrders(marginfiAccount);
      await checkPartialLiqClosePositions(marginfiAccount);
      await marginfiAccount.checkBankruptcy();
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

async function checkPartialLiqClosePositions(mfiAccount: MarginfiAccount) {
  if (mfiAccount.meetsMarginRequirement(MarginRequirementType.PartialLiquidation)) {
    return;
  }
  const debug = require("debug")("crank-bot:partial-liquidation");

  const marginRequirement = await mfiAccount.computeMarginRequirement(MarginRequirementType.PartialLiquidation);
  const { equity } = await mfiAccount.computeBalances(EquityType.InitReqAdjusted);

  const maxLiqAmountUsd = marginRequirement.minus(equity).multipliedBy(0.5);

  // Find biggest position;
  const positions: { utpIndex: number; value: number; market: any }[] = [];

  if (mfiAccount.zo.isActive) {
    debug("Checking 01 Protocol positions");
    const zoState = await mfiAccount.zo.getZoState();
    const zoMargin = await mfiAccount.zo.getZoMargin(zoState);

    await zoMargin.loadPositions();
    await zoState.loadMarkets();

    for (let i = 0; i < zoMargin.positions.length; i++) {
      const position = zoMargin.positions[i];
      const price = zoState.markets[position.marketKey].markPrice.number;
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

  if (biggestPosition.utpIndex === mfiAccount.zo.config.utpIndex) {
    const zoState = await mfiAccount.zo.getZoState();
    const zoMargin = await mfiAccount.zo.getZoMargin(zoState);

    await zoMargin.loadPositions();
    await zoState.loadMarkets();

    const position = zoMargin.position(biggestPosition.market);
    const long = !position.isLong;
    const price = zoState.markets[position.marketKey].markPrice.number;

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

    await mfiAccount.zo.placePerpOrder({
      symbol: position.marketKey,
      isLong: long,
      price: long ? 1_000_000_000 : 0.000001,
      orderType: ZoPerpOrderType.ReduceOnlyIoc,
      size: size.toNumber(),
    });
  }
}

async function checkPartialLiqCloseOpenOrders(marginfiAccount: MarginfiAccount) {
  if (marginfiAccount.meetsMarginRequirement(MarginRequirementType.PartialLiquidation)) {
    return;
  }

  if (marginfiAccount.zo.isActive) {
    const zoState = await marginfiAccount.zo.getZoState();
    const zoMargin = await marginfiAccount.zo.getZoMargin(zoState);

    await zoMargin.loadOrders();
    for (let order of zoMargin.orders) {
      await marginfiAccount.zo.cancelPerpOrder({
        symbol: order.symbol,
        orderId: order.orderId,
        isLong: order.long,
      });
    }
  }
}
