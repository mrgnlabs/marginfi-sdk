import { Provider } from "@project-serum/anchor";
import { Connection, PublicKey } from "@solana/web3.js";
import {
  Cluster,
  createProgram,
  Margin,
  State,
  ZO_DEX_DEVNET_PROGRAM_ID,
  ZO_DEX_MAINNET_PROGRAM_ID,
} from "@zero_one/client";
import { BN } from "bn.js";
import { assert } from "chai";
import { Wallet } from "..";
import { AccountType, BankVaultType } from "../types";
import { getMangoAccountPda } from "../utp/mango";
import { getBankAuthority, getUtpAuthority, isAccountType } from "./helpers";

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

describe("PDA", () => {
  it("UTP authority", async function () {
    const pda = await getUtpAuthority(
      new PublicKey("6ovvJd93CZqn6GgW29j39yJKnbuqqYKET2G55AXbbSNR"),
      new PublicKey("DzEv7WuxdzRJ1iTdT5X6RmX2gdzSXUvyQ14ELmveiFSQ"),
      new PublicKey("5yg2EnX2Vn14SKdEvYooyaj5KmE4xGgHviQKGB5Y9oFQ")
    );
    assert.isTrue(pda[0].equals(new PublicKey("2zbmcZ82RL65hZH9Wqaqon315QjVY7ALEejTbCK6CC9b")));
    assert.equal(pda[1], 255);
  });

  it("bank authority", async function () {
    const pda = await getBankAuthority(
      new PublicKey("6ovvJd93CZqn6GgW29j39yJKnbuqqYKET2G55AXbbSNR"),
      new PublicKey("DzEv7WuxdzRJ1iTdT5X6RmX2gdzSXUvyQ14ELmveiFSQ"),
      BankVaultType.LiquidityVault
    );
    assert.isTrue(pda[0].equals(new PublicKey("Ah2FBNwdgTxrY4HgJqzr2B3H4XZ6wQ5dYPBvPtQeACM8")));
    assert.equal(pda[1], 255);
  });

  it("mango account", async function () {
    const pda = await getMangoAccountPda(
      new PublicKey("6ovvJd93CZqn6GgW29j39yJKnbuqqYKET2G55AXbbSNR"),
      new PublicKey("DzEv7WuxdzRJ1iTdT5X6RmX2gdzSXUvyQ14ELmveiFSQ"),
      new BN(88),
      new PublicKey("5yg2EnX2Vn14SKdEvYooyaj5KmE4xGgHviQKGB5Y9oFQ")
    );
    assert.isTrue(pda[0].equals(new PublicKey("F8H1zRowNeJ8mbxMLDYzL9Kejd24wu7yEAz65f87UMSa")));
    assert.equal(pda[1], 255);
  });

  it.only("ha", async function () {
    const connection = new Connection("http://devnet.genesysgo.net/");
    const wallet = Wallet.local();
    const provider = new Provider(connection, wallet, Provider.defaultOptions());
    const program = await createProgram(provider, Cluster.Devnet);
    const state = await State.load(program, new PublicKey("KwcWW7WvgSXLJcyjKZJBHLbfriErggzYHpjS9qjVD5F"));
    const margin = await Margin.load(
      program,
      state,
      state.cache,
      new PublicKey("Ax5ThxoGDiVXgAcDcq5k2B3EebRP6wmdqN5F24jEa2tN")
    );

    const marketPk = await state.markets["SOL-PERP"].pubKey;
    const dexMarket = state.getMarketKeyBySymbol("SOL-PERP");
    const [openOrdersPk, bump] = await margin.getOpenOrdersKeyBySymbol("SOL-PERP", Cluster.Devnet);
    console.log("control", margin.data.control.toBase58());
    console.log("dexMarket", dexMarket.toBase58());
    const [openOrdersPk2, bump2] = await PublicKey.findProgramAddress(
      [margin.data.control.toBuffer(), dexMarket.toBuffer()],
      Cluster.Devnet === Cluster.Devnet ? ZO_DEX_DEVNET_PROGRAM_ID : ZO_DEX_MAINNET_PROGRAM_ID
    );
    console.log({
      margin: margin.pubkey.toBase58(),
      openOrdersPk: openOrdersPk.toBase58(),
      bump,
      openOrdersPk2: openOrdersPk2.toBase58(),
      bump2,
      control: margin.data.control.toBase58(),
      market: marketPk.toBase58(),
      dexMarket: dexMarket.toBase58(),
    });
    console.log(margin.data.control.toBuffer().toString("hex"));
    console.log(dexMarket.toBuffer().toString("hex"));
  });
});
