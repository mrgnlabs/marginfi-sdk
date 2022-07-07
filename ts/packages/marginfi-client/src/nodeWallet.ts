import AnchorNodeWallet from "@project-serum/anchor/dist/cjs/nodewallet";
import { Wallet as IWallet } from "@project-serum/anchor/dist/cjs/provider";
import { Keypair, PublicKey, Transaction } from "@solana/web3.js";

/**
 * NodeWallet
 *
 * Anchor-compliant wallet implementation.
 */
export class NodeWallet implements IWallet {
  /**
   * @param payer Keypair of the associated payer
   */
  constructor(readonly payer: Keypair) {}

  /**
   * Factory for the local wallet.
   * Makes use of the `MARGINFI_WALLET` env var, with fallback to `$HOME/.config/solana/id.json`.
   */
  static local(): NodeWallet {
    const process = require("process");
    const payer = Keypair.fromSecretKey(
      Buffer.from(
        JSON.parse(
          require("fs").readFileSync(
            process.env.MARGINFI_WALLET || require("path").join(require("os").homedir(), ".config/solana/id.json"),
            {
              encoding: "utf-8",
            }
          )
        )
      )
    );
    return new NodeWallet(payer);
  }

  /**
   * Factory for the Anchor local wallet.
   */
  static anchor(): NodeWallet {
    return AnchorNodeWallet.local();
  }

  async signTransaction(tx: Transaction): Promise<Transaction> {
    tx.partialSign(this.payer);
    return tx;
  }

  async signAllTransactions(txs: Transaction[]): Promise<Transaction[]> {
    return txs.map((t) => {
      t.partialSign(this.payer);
      return t;
    });
  }

  get publicKey(): PublicKey {
    return this.payer.publicKey;
  }
}
