require("dotenv").config();

import { Command } from "commander";
import { createAccount } from "./src/account/create";
import { deposit } from "./src/account/deposit";
import { activateDrift } from "./src/account/drift/activate";
import { depositDrift } from "./src/account/drift/deposit";
import { getAccount } from "./src/account/get";
import { activateMango } from "./src/account/mango/activate";
import { depositMango } from "./src/account/mango/deposit";
import { configureGroup } from "./src/group/configure-group";
import { createGroup } from "./src/group/create-group";
import { getGroup } from "./src/group/load-group-config";
import { airdropCollateral } from "./src/token-faucet";

const DEFAULT_MARGIN_GROUP = process.env.MARGIN_GROUP;

const cliProgram = new Command();

cliProgram.name("marginfi admin cli tool");

cliProgram
  .command("faucet-airdrop")
  .argument("<amount>")
  .requiredOption("-F, --faucet <address>", "faucet address")
  .requiredOption("-M, --mint <address>", "mint address")
  .action(airdropCollateral);

const groupProgram = cliProgram.command("group");

groupProgram.command("get").argument("<address>", "group address").action(getGroup);

groupProgram
  .command("create")
  .requiredOption("-C, --collateral <string>", "collateral mint address")
  .action(createGroup);

groupProgram
  .command("config")
  .argument("<address>", "group address")
  .option("--admin <string>", "group admin")
  .option("--scalingFactorC <number>", "interest rate curve scaling factor c")
  .option("--fixedFee <number>", "interest rate curve fixed fee")
  .option("--interestFee <number>", "interest rate curve interest fee")
  .option("--initMarginRatio <number>", "initialization margin ratio")
  .option("--maintMarginRatio <number>", "maintenance margin ratio")
  .option("-P, --paused <boolean>", "paused")
  .option("--deposit-limit", "account deposit limit")
  .action(configureGroup);

const accountProgram = cliProgram.command("account");

accountProgram
  .command("create")
  .requiredOption("-G, --group <address>", "margin group address", DEFAULT_MARGIN_GROUP)
  .action(createAccount);

accountProgram.command("deposit").arguments("<address> [amount]").action(deposit);

accountProgram
  .command("get")
  .argument("<address>", "account address")
  .requiredOption("-G, --group <address>", "margin group address", DEFAULT_MARGIN_GROUP)
  .action(getAccount);

const mangoProgram = accountProgram.command("mango");

mangoProgram
  .command("activate")
  .argument("<address>", "account address")
  .requiredOption("-G, --group <address>", "margin group address", DEFAULT_MARGIN_GROUP)
  .action(activateMango);

mangoProgram
  .command("deposit")
  .requiredOption("-G, --group <address>", "margin group address", DEFAULT_MARGIN_GROUP)
  .arguments("<address> [amount]")
  .action(depositMango);

const driftProgram = accountProgram.command("drift");

driftProgram
  .command("activate")
  .argument("<address>", "account address")
  .requiredOption("-G, --group <address>", "margin group address", DEFAULT_MARGIN_GROUP)
  .action(activateDrift);

driftProgram
  .command("deposit")
  .arguments("<address> [amount]")
  .requiredOption("-G, --group <address>", "margin group address", DEFAULT_MARGIN_GROUP)
  .action(depositDrift);

cliProgram.parse();
