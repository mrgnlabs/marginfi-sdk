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
  nativetoUi,
} from "@mrgnlabs/marginfi-client";
import {
  Connection,
  Keypair,
  Transaction,
  ConfirmOptions,
  SystemProgram,
} from "@solana/web3.js";
import { SYSTEM_PROGRAM_ID } from "@zero_one/client";
import { airdropCollateral, getMangoAccountPda } from "./utils";
import {
  AccountInfo,
  AccountLayout,
  Token,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import { BN } from "bn.js";

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
    // Load general configs for the deployment + UTPs on the specified cluster
    config = await getConfig(Environment.DEVNET, connection);

    // Setup USDC mint ATA (collateral used by marginfi)
    collateral = new Token(
      connection,
      config.collateralMintPk,
      TOKEN_PROGRAM_ID,
      wallet.payer
    );
    ataAi = await collateral.getOrCreateAssociatedAccountInfo(wallet.publicKey);

    // Setup a marginfi client to have a view on the account and access helpers
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
      `Marginfi account created: ${marginfiAccountKeypair.publicKey} (sig: ${sig})`
    );
    console.log(marginfiAccount.toString());
  });

  it("separately deposits and withdraws", async () => {
    const depositAmount = uiToNative(10);

    await airdropCollateral(
      mfClient.program.provider,
      depositAmount.toNumber(),
      config.collateralMintPk,
      ataAi.address
    );

    const [marginBankAuthority] = await getBankAuthority(
      config.groupPk,
      config.programId
    );

    const depositIx = await program.methods
      .deposit(depositAmount)
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
    console.log(
      `\n${nativetoUi(depositAmount, 6)} USDC deposited from GMA: ${sig1}`
    );

    await marginfiAccount.reload();
    console.log(marginfiAccount.toString());

    const withdrawAmount = depositAmount.subn(1);

    const withdrawIx = await program.methods
      .withdraw(withdrawAmount)
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
    console.log(
      `\n${nativetoUi(withdrawAmount, 6)} USDC withdrawn from GMA: ${sig2}`
    );

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
    const sig = await processTransaction(program.provider, tx, [], txOpts);
    console.log(
      `\n${nativetoUi(amount, 6)} USDC deposited and withdrawn: ${sig}`
    );

    await marginfiAccount.reload();
    console.log(marginfiAccount.toString());
  });

  it("atomically deposits, activate Mango UTP, fund Mango UTP", async () => {
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

    const authoritySeed = Keypair.generate();

    const [mangoAuthority, mangAuthorityBump] =
      await marginfiAccount.mango.authority(authoritySeed.publicKey);
    const [mangoAccount] = await getMangoAccountPda(
      config.mango.groupConfig.publicKey,
      mangoAuthority,
      new BN(0),
      config.mango.programId
    );

    const proxyTokenAccountKey = Keypair.generate();
    const createProxyTokenAccountIx = SystemProgram.createAccount({
      fromPubkey: program.provider.wallet.publicKey,
      lamports:
        await program.provider.connection.getMinimumBalanceForRentExemption(
          AccountLayout.span
        ),
      newAccountPubkey: proxyTokenAccountKey.publicKey,
      programId: TOKEN_PROGRAM_ID,
      space: AccountLayout.span,
    });
    const initProxyTokenAccountIx = Token.createInitAccountInstruction(
      TOKEN_PROGRAM_ID,
      marginfiAccount.group.bank.mint,
      proxyTokenAccountKey.publicKey,
      mangoAuthority
    );

    const mangoGroup = await marginfiAccount.mango.getMangoGroup();

    const collateralMintIndex = mangoGroup.getTokenIndex(
      config.collateralMintPk
    );
    await mangoGroup.loadRootBanks(program.provider.connection);
    const mangoRootBank = mangoGroup.tokens[collateralMintIndex].rootBank;
    const mangoNodeBank =
      mangoGroup.rootBankAccounts[collateralMintIndex]!.nodeBankAccounts[0]
        .publicKey;
    const mangoVault =
      mangoGroup.rootBankAccounts[collateralMintIndex]!.nodeBankAccounts[0]
        .vault;

    const remainingAccounts =
      await marginfiAccount.mango.getObservationAccounts();
    // Little hack required when activating + despositing atomically, until fixed in SDK
    remainingAccounts[0].pubkey = mangoAccount;

    const tx = await program.methods
      .setupMango(amount, authoritySeed.publicKey, mangAuthorityBump)
      .accounts({
        marginfiAccount: marginfiAccount.publicKey,
        marginfiGroup: mfClient.config.groupPk,
        marginfiProgram: mfClient.programId,
        signer: wallet.publicKey,
        marginBankAuthority,
        tempCollateralAccount: proxyTokenAccountKey.publicKey,
        fundingAccount: ataAi.address,
        mangoAccount,
        mangoAuthority,
        mangoGroup: config.mango.groupConfig.publicKey,
        mangoProgram: config.mango.programId,
        mangoCache: mangoGroup.mangoCache,
        mangoNodeBank,
        mangoRootBank,
        mangoVault,
        tokenVault: mfClient.group.bank.vault,
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: SYSTEM_PROGRAM_ID,
      })
      .remainingAccounts(remainingAccounts)
      .preInstructions([createProxyTokenAccountIx, initProxyTokenAccountIx])
      .transaction();

    const sig = await processTransaction(
      program.provider,
      tx,
      [proxyTokenAccountKey],
      txOpts
    );
    console.log(`\n${nativetoUi(amount, 6)} USDC deposited to mango: ${sig}`);

    await marginfiAccount.reload(true);
    console.log(marginfiAccount.toString());
  });
});
