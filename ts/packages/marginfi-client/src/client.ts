import { BorshAccountsCoder, Program, Provider } from "@project-serum/anchor";
import { bs58 } from "@project-serum/anchor/dist/cjs/utils/bytes";
import { ConfirmOptions, Connection, Keypair, PublicKey, Transaction } from "@solana/web3.js";
import { Wallet } from ".";
import { MarginfiConfig } from "./config";
import { MarginfiIdl, MARGINFI_IDL } from "./idl";
import { makeInitMarginAccountIx } from "./instruction";
import { MarginAccount } from "./marginAccount";
import { MarginfiGroup } from "./marginfiGroup";
import { AccountType, MarginAccountData } from "./types";
import { processTransaction } from "./utils";

/**
 * Entrypoint to interact with the marginfi contract.
 */
export class MarginfiClient {
  public readonly program: Program<MarginfiIdl>;
  public readonly config: MarginfiConfig;

  public readonly programId: PublicKey;
  private _group: MarginfiGroup;

  /**
   * @internal
   */
  private constructor(config: MarginfiConfig, program: Program<MarginfiIdl>, group: MarginfiGroup) {
    this.config = config;
    this.program = program;
    this.programId = config.programId;
    this._group = group;
  }

  // --- Factories

  /**
   * MarginfiClient factory
   *
   * Fetch account data according to the config and instantiate the corresponding MarginAccount.
   *
   * @param config marginfi config
   * @param wallet User wallet (used to pay fees and sign transations)
   * @param connection Solana web.js Connection object
   * @param opts Solana web.js ConfirmOptions object
   * @returns MarginfiClient instance
   */
  static async get(config: MarginfiConfig, wallet: Wallet, connection: Connection, opts?: ConfirmOptions) {
    const provider = new Provider(connection, wallet, opts || Provider.defaultOptions());
    const program = new Program(MARGINFI_IDL, config.programId, provider) as Program<MarginfiIdl>;
    return new MarginfiClient(config, program, await MarginfiGroup.get(config, program));
  }

  // --- Getters and setters

  /**
   * Margin account group address
   */
  get group(): MarginfiGroup {
    return this._group;
  }

  // --- Others

  /**
   * Create a new margin account under the authority of the user.
   *
   * @returns MarginAccount instance
   */
  async createMarginAccount(): Promise<MarginAccount> {
    const dbg = require("debug")("mfi:client");
    const marginAccountKey = Keypair.generate();

    dbg("Creating Margin Account %s", marginAccountKey.publicKey);

    const createMarginAccountAccountIx = await this.program.account.marginAccount.createInstruction(marginAccountKey);
    const initMarginAccountIx = await makeInitMarginAccountIx(this.program, {
      marginfiGroupPk: this._group.publicKey,
      marginAccountPk: marginAccountKey.publicKey,
      authorityPk: this.program.provider.wallet.publicKey,
    });

    const ixs = [createMarginAccountAccountIx, initMarginAccountIx];

    const tx = new Transaction().add(...ixs);
    const sig = await processTransaction(this.program.provider, tx, [marginAccountKey]);

    dbg("Created Margin account %s", sig);

    return MarginAccount.get(marginAccountKey.publicKey, this);
  }

  /**
   * Retrieves all margin accounts under the authority of the user.
   *
   * @returns MarginAccount instances
   */
  async getOwnMarginAccounts(): Promise<MarginAccount[]> {
    const marginfiGroup = await MarginfiGroup.get(this.config, this.program);
    return (
      await this.program.account.marginAccount.all([
        {
          memcmp: {
            bytes: this.program.provider.wallet.publicKey.toBase58(),
            offset: 8, // authority is the first field in the account, so only offset is the discriminant
          },
        },
        {
          memcmp: {
            bytes: this._group.publicKey.toBase58(),
            offset: 8 + 32, // margin_group is the second field in the account after the authority, so offset by the discriminant and a pubkey
          },
        },
      ])
    ).map((a) => MarginAccount.fromAccountData(a.publicKey, this, a.account as MarginAccountData, marginfiGroup));
  }

  /**
   * Retrieves all margin accounts in the underlying group.
   *
   * @returns MarginAccount instances
   */
  async getAllMarginAccounts(): Promise<MarginAccount[]> {
    const marginfiGroup = await MarginfiGroup.get(this.config, this.program);
    const marginAccountAddresses = await this.getAllMarginAccountAddresses();

    return (await this.program.account.marginAccount.fetchMultiple(marginAccountAddresses))
      .filter((a) => a !== null)
      .map((account, i) =>
        MarginAccount.fromAccountData(marginAccountAddresses[i], this, account as MarginAccountData, marginfiGroup)
      );
  }

  async getMarginAccount(address: PublicKey): Promise<MarginAccount> {
    return MarginAccount.get(address, this);
  }

  /**
   * Retrieves the addresses of all margin accounts in the udnerlying group.
   *
   * @returns Account addresses
   */
  async getAllMarginAccountAddresses(): Promise<PublicKey[]> {
    return (
      await this.program.provider.connection.getProgramAccounts(this.programId, {
        commitment: this.program.provider.connection.commitment,
        dataSlice: {
          offset: 0,
          length: 0,
        },
        filters: [
          {
            memcmp: {
              bytes: this._group.publicKey.toBase58(),
              offset: 8 + 32, // margin_group is the second field in the account after the authority, so offset by the discriminant and a pubkey
            },
          },
          {
            memcmp: {
              offset: 0,
              bytes: bs58.encode(BorshAccountsCoder.accountDiscriminator(AccountType.MarginAccount)),
            },
          },
        ],
      })
    ).map((a) => a.pubkey);
  }
  /**
   * Retrieves the addresses of all accounts owned by the marginfi program.
   *
   * @returns Account addresses
   */
  async getAllProgramAccountAddresses(type: AccountType): Promise<PublicKey[]> {
    return (
      await this.program.provider.connection.getProgramAccounts(this.programId, {
        commitment: this.program.provider.connection.commitment,
        dataSlice: {
          offset: 0,
          length: 0,
        },
        filters: [
          {
            memcmp: {
              offset: 0,
              bytes: bs58.encode(BorshAccountsCoder.accountDiscriminator(type)),
            },
          },
        ],
      })
    ).map((a) => a.pubkey);
  }
}
