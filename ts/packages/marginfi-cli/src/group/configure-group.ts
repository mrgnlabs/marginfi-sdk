import { instructions, MarginfiClient, processTransaction } from "@mrgnlabs/marginfi-client";
import { BN } from "@project-serum/anchor";
import { PublicKey, Transaction } from "@solana/web3.js";
import { OptionValues } from "commander";

export async function configureGroup(options: OptionValues) {
  const client = await MarginfiClient.fromEnv();
  const program = client.program;

  const wallet = program.provider.wallet;
  const marginfiGroupPk = client.group.publicKey;
  
  const args = {
    admin: options.admin ? new PublicKey(options.admin) : undefined,
    bank: {
      scalingFactorC: parseOption(options.scalingFactorC),
      fixedFee: parseOption(options.fixedFee),
      interestFee: parseOption(options.interestFee),
      initMarginRatio: parseOption(options.initMarginRatio),
      maintMarginRatio: parseOption(options.maintMarginRatio),
      accountDepositLimit: parseOption(options.accountDepositLimit),
      lpDepositLimit: parseOption(options.lpDepositLimit),
    },
    paused: parsePaused(options.paused),
  };

  const ix = await instructions.makeConfigureMarginfiGroupIx(
    program,
    {
      adminPk: wallet.publicKey,
      marginfiGroupPk: marginfiGroupPk,
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

  return undefined;
}

function parseOption(option?: number): BN | undefined {
  return option ? new BN(option * 10 ** 6) : undefined;
}
