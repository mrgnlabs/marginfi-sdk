import * as anchor from "@project-serum/anchor";
import { Program } from "@project-serum/anchor";
import { ExampleCpi } from "../target/types/example_cpi";
import {
  getConfig,
  Environment,
  MarginfiClient,
  Wallet,
  processTransaction,
} from "@mrgnlabs/marginfi-client";
import {
  Connection,
  Keypair,
  Transaction,
  ConfirmOptions,
} from "@solana/web3.js";
import { SYSTEM_PROGRAM_ID } from "@zero_one/client";

describe("example-cpi", () => {
  anchor.setProvider(anchor.Provider.env());
  const program = anchor.workspace.ExampleCpi as Program<ExampleCpi>;
  const txOpts: ConfirmOptions = { commitment: "confirmed" };

  it("initializes a marginfi account", async () => {
    const connection = new Connection("https://api.devnet.solana.com", txOpts);
    const wallet = Wallet.local();
    const config = await getConfig(Environment.DEVNET, connection);

    // Setup the client
    const mfClient = await MarginfiClient.fetch(
      config,
      wallet,
      connection,
      txOpts
    );

    const marginfiAccountKeypair = Keypair.generate();
    const createMarginfiAccountIx =
      await mfClient.program.account.marginfiAccount.createInstruction(
        marginfiAccountKeypair
      );
    const initMarginfiAccountIx = await program.methods
      .initializeAccount()
      .accounts({
        marginfiAccount: marginfiAccountKeypair.publicKey,
        marginfiGroup: mfClient.config.groupPk,
        marginfiProgram: mfClient.programId,
        signer: wallet.publicKey,
        systemProgram: SYSTEM_PROGRAM_ID,
      })
      .instruction();

    const tx = new Transaction().add(
      createMarginfiAccountIx,
      initMarginfiAccountIx
    );
    const sig = await processTransaction(program.provider, tx, [
      marginfiAccountKeypair,
    ]);
    console.log(
      `Marginfi account initialized: ${marginfiAccountKeypair.publicKey} (sig: ${sig})`
    );

    // console.log("Marginfi account created: %s", marginfiAccount.publicKey);
  });
});
