import { getMfiProgram, loadKeypair, Wallet } from "@mrgnlabs/marginfi-client";
import { Connection, PublicKey } from "@solana/web3.js";
import { parseDecimal } from "../common";

require("dotenv").config();

const program = getMfiProgram(
  new PublicKey(process.env.MARGINFI_PROGRAM!),
  new Connection(process.env.RPC_ENDPOINT!),
  new Wallet(loadKeypair(process.env.WALLET!))
);

export async function getGroup(address: string) {
  const group = await program.account.marginGroup.fetch(address);

  console.log("Margin Group: %s", address);
  console.log("Admin: %s", group.admin);

  console.log("Bank");
  console.log(
    "Interest rate curve parameters: %s %s %s",
    parseDecimal(group.bank.scalingFactorC),
    parseDecimal(group.bank.interestFee),
    parseDecimal(group.bank.fixedFee)
  );

  console.log(
    "Init margin: %s, Maint margin %s",
    parseDecimal(group.bank.initMarginRatio),
    parseDecimal(group.bank.maintMarginRatio)
  );

  console.log("Deposits: %s", parseDecimal(group.bank.nativeDepositBalance));
  console.log("Borrows: %s", parseDecimal(group.bank.nativeBorrowBalance));

  console.log("Paused: %s", group.paused);
}
