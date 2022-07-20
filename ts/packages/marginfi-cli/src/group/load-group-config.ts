import { MarginfiGroup } from "@mrgnlabs/marginfi-client";
import { OptionValues } from "commander";
import { getClientFromOptions } from "../common";

export async function getGroup(address: string, options: OptionValues) {
  const client = await getClientFromOptions(options);
  const program = client.program;
  const group = await MarginfiGroup.fetch(client.config, program);

  console.log("Marginfi Group: %s", address);
  console.log("Admin: %s", group.admin);

  console.log("Bank");
  console.log(
    "Interest rate curve parameters: %s %s %s",
    group.bank.scalingFactorC,
    group.bank.interestFee,
    group.bank.fixedFee
  );

  console.log("Init margin: %s, Maint margin %s", group.bank.initMarginRatio, group.bank.maintMarginRatio);

  console.log("Deposits: %s", group.bank.nativeDepositBalance);
  console.log("Borrows: %s", group.bank.nativeBorrowBalance);

  //@ts-ignore
  console.log("Paused: %s", group.paused);
}
