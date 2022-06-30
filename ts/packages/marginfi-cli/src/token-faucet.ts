import { getConfig, getMfiProgram, loadKeypair, processTransaction, Wallet } from "@mrgnlabs/marginfi-client";
import { BN, Provider } from "@project-serum/anchor";
import { ASSOCIATED_PROGRAM_ID } from "@project-serum/anchor/dist/cjs/utils/token";
import { Token, TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { Connection, PublicKey, Transaction, TransactionInstruction } from "@solana/web3.js";
import { OptionValues } from "commander";
import { getEnvironment } from "./common";

export async function airdropCollateral(amountDec: string, options: OptionValues) {
  const connection = new Connection(options.url, "confirmed");
  const config = await getConfig(getEnvironment(options.env), connection);

  const program = getMfiProgram(config.programId, connection, new Wallet(loadKeypair(options.keypair)));

  const wallet = program.provider.wallet;
  const amount = Number.parseFloat(amountDec) * 10 ** 6;

  const faucet = new PublicKey(options.faucet);
  const mint = new PublicKey(options.mint);

  const provider = program.provider;

  const tokenAccount = await getAtaOrCreate(provider, wallet.publicKey, mint);

  const [faucetPda] = await PublicKey.findProgramAddress([Buffer.from("faucet")], FAUCET_PROGRAM_ID);

  const keys = [
    { pubkey: faucetPda, isSigner: false, isWritable: false },
    { pubkey: mint, isSigner: false, isWritable: true },
    { pubkey: tokenAccount, isSigner: false, isWritable: true },
    { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
    { pubkey: faucet, isSigner: false, isWritable: false },
  ];

  const airdropIx = new TransactionInstruction({
    programId: FAUCET_PROGRAM_ID,
    data: Buffer.from([1, ...new BN(amount).toArray("le", 8)]),
    keys,
  });

  const tx = new Transaction();
  tx.add(airdropIx);

  const sig = await processTransaction(provider, tx, [], {
    skipPreflight: true,
  });

  console.log("Signature %s", sig);
}

const FAUCET_PROGRAM_ID = new PublicKey("4bXpkKSV8swHSnwqtzuboGPaPDeEgAn4Vt8GfarV5rZt");

async function getAtaOrCreate(provider: Provider, payerPk: PublicKey, mint: PublicKey): Promise<PublicKey> {
  const ata = await Token.getAssociatedTokenAddress(ASSOCIATED_PROGRAM_ID, TOKEN_PROGRAM_ID, mint, payerPk);

  const ataAccountInfo = await provider.connection.getAccountInfo(ata);
  if (!ataAccountInfo) {
    const createAtaIx = Token.createAssociatedTokenAccountInstruction(
      ASSOCIATED_PROGRAM_ID,
      TOKEN_PROGRAM_ID,
      mint,
      ata,
      payerPk,
      payerPk
    );
    const tx = new Transaction();
    tx.add(createAtaIx);

    await processTransaction(provider, tx, []);
  }

  return ata;
}
