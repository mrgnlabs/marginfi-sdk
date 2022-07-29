import * as anchor from "@project-serum/anchor";
import { Program } from "@project-serum/anchor";
import { ExampleCpi } from "../target/types/example_cpi";
import {
  getConfig,
  Environment,
  MarginfiClient,
  Wallet,
  processTransaction,
  MarginfiAccount,
  MarginfiConfig,
  getBankAuthority,
  uiToNative,
} from "@mrgnlabs/marginfi-client";
import {
  Connection,
  Keypair,
  Transaction,
  ConfirmOptions,
} from "@solana/web3.js";
import { SYSTEM_PROGRAM_ID } from "@zero_one/client";
import { airdropCollateral } from "./utils";
import { AccountInfo, Token, TOKEN_PROGRAM_ID } from "@solana/spl-token";

describe("example-cpi", () => {
  anchor.setProvider(anchor.Provider.env());

  const program = anchor.workspace.ExampleCpi as Program<ExampleCpi>;
  const txOpts: ConfirmOptions = { commitment: "processed" };
  const connection = new Connection("https://api.devnet.solana.com", txOpts);
  const wallet = Wallet.local();

  let config: MarginfiConfig;
  let collateral: Token;
  let ataAi: AccountInfo;
  let mfClient: MarginfiClient;

  before(async () => {
    config = await getConfig(Environment.DEVNET, connection);
    collateral = new Token(
      connection,
      config.collateralMintPk,
      TOKEN_PROGRAM_ID,
      wallet.payer
    );
    ataAi = await collateral.getOrCreateAssociatedAccountInfo(wallet.publicKey);

    // Setup the client for easy feedback
    mfClient = await MarginfiClient.fetch(config, wallet, connection, txOpts);
  });

  let marginfiAccount: MarginfiAccount;

  it("initializes a marginfi account", async () => {
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
    const sig = await processTransaction(
      program.provider,
      tx,
      [marginfiAccountKeypair],
      txOpts
    );

    marginfiAccount = await mfClient.getMarginfiAccount(
      marginfiAccountKeypair.publicKey
    );
    console.log(
      `Marginfi account initialized: ${marginfiAccountKeypair.publicKey} (sig: ${sig})`
    );
  });

  it("deposits and withdraws", async () => {
    const amount = uiToNative(10);

    await airdropCollateral(
      mfClient.program.provider,
      amount.toNumber(),
      config.collateralMintPk,
      ataAi.address
    );

    const [marginBankAuthority] = await getBankAuthority(
      config.groupPk,
      config.programId
    );

    const depositIx = await program.methods
      .deposit(amount)
      .accounts({
        marginfiAccount: marginfiAccount.publicKey,
        marginfiGroup: mfClient.config.groupPk,
        marginfiProgram: mfClient.programId,
        signer: wallet.publicKey,
        fundingAccount: ataAi.address,
        tokenVault: mfClient.group.bank.vault,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .instruction();

    const tx1 = new Transaction().add(depositIx);
    const sig1 = await processTransaction(program.provider, tx1, [], txOpts);
    console.log(`\nDeposit sig: ${sig1}`);

    await marginfiAccount.reload();
    console.log(marginfiAccount.toString());

    const withdrawIx = await program.methods
      .withdraw(amount.subn(1))
      .accounts({
        marginfiAccount: marginfiAccount.publicKey,
        marginfiGroup: mfClient.config.groupPk,
        marginfiProgram: mfClient.programId,
        signer: wallet.publicKey,
        receivingTokenAccount: ataAi.address,
        tokenVault: mfClient.group.bank.vault,
        tokenProgram: TOKEN_PROGRAM_ID,
        marginBankAuthority,
      })
      .instruction();

    const tx2 = new Transaction().add(withdrawIx);
    const sig2 = await processTransaction(program.provider, tx2, [], txOpts);
    console.log(`\nWithdraw sig: ${sig2}`);

    await marginfiAccount.reload();
    console.log(marginfiAccount.toString());
  });

  it("atomically deposits and withdraws", async () => {
    const amount = uiToNative(10);

    await airdropCollateral(
      mfClient.program.provider,
      amount.toNumber(),
      config.collateralMintPk,
      ataAi.address
    );

    const [marginBankAuthority] = await getBankAuthority(
      config.groupPk,
      config.programId
    );

    const depositAndWithdrawIx = await program.methods
      .depositAndWithdraw(amount)
      .accounts({
        marginfiAccount: marginfiAccount.publicKey,
        marginfiGroup: mfClient.config.groupPk,
        marginfiProgram: mfClient.programId,
        signer: wallet.publicKey,
        userTokenAccount: ataAi.address,
        marginBankAuthority,
        tokenVault: mfClient.group.bank.vault,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .instruction();

    const tx = new Transaction().add(depositAndWithdrawIx);
    const sig = await processTransaction(program.provider, tx);
    console.log(`DepositAndWithdraw sig: ${sig}`);

    await marginfiAccount.reload();
    console.log(marginfiAccount.toString());
  });
});
