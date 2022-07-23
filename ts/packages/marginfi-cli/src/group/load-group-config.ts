import { MarginfiClient } from "@mrgnlabs/marginfi-client";

export async function getGroup() {
  const client = await MarginfiClient.fromEnv()
  const group = client.group;

  console.log("Marginfi Group: %s", group.publicKey);
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
}
