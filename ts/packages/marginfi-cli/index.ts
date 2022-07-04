require("dotenv").config();

import { Command } from "commander";
import { createAccount } from "./src/account/create";
import { deposit } from "./src/account/deposit";
import { getAccount, getAccounts as listAccounts } from "./src/account/get";
import { activateMango } from "./src/account/mango/activate";
import { depositMango } from "./src/account/mango/deposit";
import { withdrawMango } from "./src/account/mango/withdraw";
import { withdraw } from "./src/account/withdraw";
import { activateZo } from "./src/account/zo/activate";
import { depositZo } from "./src/account/zo/deposit";
import { withdrawZo } from "./src/account/zo/withdraw";
import { decodeEvent } from "./src/decode-event";
import { configureGroup } from "./src/group/configure-group";
import { createGroup } from "./src/group/create-group";
import { getGroup } from "./src/group/load-group-config";
import { airdropCollateral } from "./src/token-faucet";

function attachDefaultOptions(command: Command, excludeGroup: boolean = false): Command {
  command.requiredOption("-k, --keypair <KEYPAIR>", "Path to keypair file", "~/.config/solana/id.json");
  command.requiredOption("-u, --url <URL>", "URL for Solana's JSON RPC", "https://marginfi.genesysgo.net/");
  command.requiredOption(
    "-e, --environment <ENVIRONMENT>",
    "Environment to use [mainnet-beta, devnet]",
    "mainnet-beta"
  );

  if (!excludeGroup) {
    command.option("-G, --group <address>", "marginfi group address");
  }

  return command;
}

const cliProgram = new Command();

cliProgram.name("marginfi cli");

const accountProgram = cliProgram.command("account");

attachDefaultOptions(accountProgram.command("create")).action(createAccount);
attachDefaultOptions(accountProgram.command("get")).argument("<address>", "account address").action(getAccount);
attachDefaultOptions(accountProgram.command("list")).action(listAccounts);

attachDefaultOptions(accountProgram.command("deposit")).arguments("<address> [amount]").action(deposit);
attachDefaultOptions(accountProgram.command("withdraw")).arguments("<address> [amount]").action(withdraw);

const mangoProgram = accountProgram.command("mango");

attachDefaultOptions(mangoProgram.command("activate")).argument("<address>", "account address").action(activateMango);
attachDefaultOptions(mangoProgram.command("deposit")).arguments("<address> [amount]").action(depositMango);
attachDefaultOptions(mangoProgram.command("withdraw")).arguments("<address> [amount]").action(withdrawMango);

const zoProgram = accountProgram.command("zo");

attachDefaultOptions(zoProgram.command("activate")).argument("<address>", "account address").action(activateZo);
attachDefaultOptions(zoProgram.command("deposit")).arguments("<address> [amount]").action(depositZo);
attachDefaultOptions(zoProgram.command("withdraw")).arguments("<address> [amount]").action(withdrawZo);

const utilProgram = cliProgram.command("utils");

attachDefaultOptions(utilProgram.command("faucet-airdrop"))
  .argument("<amount>")
  .requiredOption("-F, --faucet <address>", "faucet address")
  .requiredOption("-M, --mint <address>", "mint address")
  .action(airdropCollateral);

attachDefaultOptions(utilProgram.command("decode")).argument("<data>").action(decodeEvent);

const groupProgram = utilProgram.command("group");

attachDefaultOptions(groupProgram.command("get")).argument("<address>", "group address").action(getGroup);
attachDefaultOptions(groupProgram.command("create"))
  .requiredOption("-C, --collateral <string>", "collateral mint address")
  .action(createGroup);

attachDefaultOptions(groupProgram.command("config"), true)
  .argument("<address>", "group address")
  .option("--admin <string>", "group admin")
  .option("--scalingFactorC <number>", "interest rate curve scaling factor c")
  .option("--fixedFee <number>", "interest rate curve fixed fee")
  .option("--interestFee <number>", "interest rate curve interest fee")
  .option("--initMarginRatio <number>", "initialization margin ratio")
  .option("--maintMarginRatio <number>", "maintenance margin ratio")
  .option("-P, --paused <boolean>", "paused")
  .option("--accountDepositLimit <number>", "account deposit limit")
  .option("--lpDepositLimit <number>", "liquidity pool deposit limit")
  .action(configureGroup);

cliProgram.parse();
