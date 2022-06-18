require("dotenv").config();

import { getClientFromEnv } from "@mrgnlabs/marginfi-client";

(async function () {
  const debug = require("debug")("interest-rate-accumulator-bot");
  const client = await getClientFromEnv();
  const config = client.config;
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
