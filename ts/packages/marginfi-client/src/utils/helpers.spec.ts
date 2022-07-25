import { PublicKey } from "@solana/web3.js";
import { assert } from "chai";
import { AccountType } from "../types";
import { BankVaultType, getBankAuthority, isAccountType } from "./helpers";

const SAMPLE_MARGINFI_ACCOUNT_PARTIAL = Buffer.from([
  133, 220, 173, 213, 179, 211, 43, 238, 44, 2, 126, 189, 113, 73, 161, 166, 155, 115, 255, 201, 141, 48, 206, 246, 0,
  18, 132, 239, 35, 13, 77, 7, 124, 205, 84, 8, 70, 98, 53, 125, 177, 240, 98, 88, 247, 90, 148, 138, 122, 225, 233,
  110, 48, 188, 227, 185, 181, 131, 56, 178, 224, 77, 121, 143, 175, 68, 7, 96, 190, 57, 211, 49, 0, 0, 0, 0, 0, 0, 0,
  0, 0, 0, 0, 0,
]); // Partial account data

const SAMPLE_MARGINFI_GROUP_PARTIAL = Buffer.from([
  188, 140, 61, 138, 210, 185, 245, 45, 44, 2, 126, 189, 113, 73, 161, 166, 155, 115, 255, 201, 141, 48, 206, 246, 0,
  18, 132, 239, 35, 13, 77, 7, 124, 205, 84, 8, 70, 98, 53, 125, 0, 0, 0, 0, 0, 0, 0, 0,
]);

describe.skip("deserialization", () => {
  it("detects MarginfiAccount account type", async function () {
    assert.isTrue(isAccountType(SAMPLE_MARGINFI_ACCOUNT_PARTIAL, AccountType.MarginfiAccount));

    assert.isFalse(isAccountType(SAMPLE_MARGINFI_ACCOUNT_PARTIAL, AccountType.MarginfiGroup));
  });

  it("detects MarginfiGroup account type", async function () {
    assert.isTrue(isAccountType(SAMPLE_MARGINFI_GROUP_PARTIAL, AccountType.MarginfiGroup));

    assert.isFalse(isAccountType(SAMPLE_MARGINFI_GROUP_PARTIAL, AccountType.MarginfiAccount));
  });
});

describe.only("PDA", () => {
  it("generates", async function () {
    const pda = await getBankAuthority(
      new PublicKey("6ovvJd93CZqn6GgW29j39yJKnbuqqYKET2G55AXbbSNR"),
      new PublicKey("DzEv7WuxdzRJ9iTdT5X6RmX2gdzSXUvyQ14ELmveiFSQ"),
      BankVaultType.LiquidityVault
    );
    console.log(pda[0].toBase58(), pda[1]);
  });
});
