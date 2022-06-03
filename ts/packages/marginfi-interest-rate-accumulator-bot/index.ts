require("dotenv").config();

import { Environment, getConfig, loadKeypair, MarginfiClient, Wallet } from "@mrgnlabs/marginfi-client";
import { Connection } from "@solana/web3.js";

const wallet = new Wallet(loadKeypair(process.env.WALLET!));
const connection = new Connection(process.env.RPC_ENDPOINT!);

(async function () {
  const debug = require("debug")("interest-rate-accumulator-bot");
  const config = await getConfig(Environment.DEVNET, connection);
  const client = await MarginfiClient.get(config, wallet, connection);
  const group = client.group;

  console.log("Starting bot for group %s, on %s", group.publicKey, config.environment);

  console.log("Use DEBUG=* to see logs");

  const round = async function () {
    const sig = await group.updateInterestAccumulator();
    debug("Interest rate bot sig %s -  %s ", sig, new Date());

    setTimeout(round, Number.parseInt(process.env.TIMEOUT!));
  };
  round();
})();
