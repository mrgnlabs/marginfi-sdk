import { BN, Wallet } from "@project-serum/anchor";
import { Connection, PublicKey, Transaction } from "@solana/web3.js";
import { makeConfigureMarginGroupIx } from "@mrgnlabs/marginfi-client/src/instruction";
import {
  getMfiProgram,
  loadKeypair,
  processTransaction,
} from "@mrgnlabs/marginfi-client";
import { OptionValues } from "commander";

const program = getMfiProgram(
  new PublicKey(process.env.MARGINFI_PROGRAM!),
  new Connection(process.env.RPC_ENDPOINT!),
  new Wallet(loadKeypair(process.env.WALLET!))
);

export async function configureGroup(
  marginGroupAddress: string,
  options: OptionValues
) {
  const wallet = program.provider.wallet;
  const marginGroupPk = new PublicKey(marginGroupAddress);
  const args = {
    admin: options.admin ? new PublicKey(options.admin) : undefined,
    bank: {
      scalingFactorC: parseOption(options.scalingFactorC),
      fixedFee: parseOption(options.fixedFee),
      interestFee: parseOption(options.interestFee),
      initMarginRatio: parseOption(options.initMarginRatio),
      maintMarginRatio: parseOption(options.maintMarginRatio),
    },
    paused: parsePaused(options.paused),
  };

  const ix = await makeConfigureMarginGroupIx(
    program,
    {
      adminPk: wallet.publicKey,
      marginfiGroupPk: marginGroupPk,
    },
    { args }
  );

  const tx = new Transaction().add(ix);
  const sig = await processTransaction(program.provider, tx, undefined, {
    skipPreflight: false,
  });

  console.log("Sig %s", sig);
}

function parsePaused(pausedString: string): boolean | undefined {
  if (pausedString === "true") {
    return true;
  }
  if (pausedString === "false") {
    return false;
  }

  return undefined
}

function parseOption(option?: number): BN | undefined {
  return option ? new BN(option * 10 ** 6) : undefined;
}
