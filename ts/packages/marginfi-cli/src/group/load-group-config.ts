import { OptionValues } from "commander";
import { getClientFromOptions, parseDecimal } from "../common";

export async function getGroup(address: string, options: OptionValues) {
  const client = await getClientFromOptions(options);
  const program = client.program;

  const group = await program.account.marginfiGroup.fetch(address);

  console.log("Marginfi Group: %s", address);
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
