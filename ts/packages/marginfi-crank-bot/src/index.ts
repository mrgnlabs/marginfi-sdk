require("dotenv").config();

import './sentry';

import { getClientFromEnv, MarginfiAccount, MarginfiAccountData, MarginfiClient } from "@mrgnlabs/marginfi-client";
import { PublicKey } from "@solana/web3.js";

const marginfiGroupPk = new PublicKey(process.env.MARGINFI_GROUP!);

(async function () {
  console.log("Running crank bot, use DEBUG=* to see logs");
  const debug = require("debug")("crank-bot");
  debug("Running crank bot for group %s", marginfiGroupPk);
  const marginClient = await getClientFromEnv();
  const round = async function () {
    try {
      await loadAllMarginfiAccounts(marginClient);
    } catch (e) {
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
    await marginfiAccount.checkRebalance();
    await marginfiAccount.checkBankruptcy();
  }
}