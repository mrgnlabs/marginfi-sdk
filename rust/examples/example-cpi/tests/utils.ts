import { processTransaction } from "@mrgnlabs/marginfi-client";
import { Provider } from "@project-serum/anchor";
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";
import {
  PublicKey,
  Transaction,
  TransactionInstruction,
} from "@solana/web3.js";
import { BN } from "bn.js";

export const DEVNET_USDC_FAUCET = new PublicKey(
  "B87AhxX6BkBsj3hnyHzcerX2WxPoACC7ZyDr8E7H9geN"
);

export const FAUCET_PROGRAM_ID = new PublicKey(
  "4bXpkKSV8swHSnwqtzuboGPaPDeEgAn4Vt8GfarV5rZt"
);

export async function airdropCollateral(
  provider: Provider,
  amount: number,
  mint: PublicKey,
  tokenAccount: PublicKey
): Promise<string> {
  const [faucetPda] = await PublicKey.findProgramAddress(
    [Buffer.from("faucet")],
    FAUCET_PROGRAM_ID
  );

  const keys = [
    { pubkey: faucetPda, isSigner: false, isWritable: false },
    { pubkey: mint, isSigner: false, isWritable: true },
    { pubkey: tokenAccount, isSigner: false, isWritable: true },
    { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
    { pubkey: DEVNET_USDC_FAUCET, isSigner: false, isWritable: false },
  ];

  const airdropIx = new TransactionInstruction({
    programId: FAUCET_PROGRAM_ID,
    data: Buffer.from([1, ...new BN(amount).toArray("le", 8)]),
    keys,
  });

  const tx = new Transaction();
  tx.add(airdropIx);

  return processTransaction(provider, tx, [], {
    skipPreflight: true,
  });
}
