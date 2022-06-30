import { BorshAccountsCoder, Program, Provider, Wallet } from "@project-serum/anchor";
import { bs58 } from "@project-serum/anchor/dist/cjs/utils/bytes";
import { ConfirmOptions, Connection, Keypair, PublicKey, Transaction } from "@solana/web3.js";
import { MarginfiConfig } from "./config";
import { MarginfiIdl, MARGINFI_IDL } from "./idl";
import { makeInitMarginfiAccountIx } from "./instruction";
import { MarginfiAccount } from "./marginfiAccount";
import { MarginfiGroup } from "./marginfiGroup";
import { AccountType, MarginfiAccountData } from "./types";
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
   * Fetch account data according to the config and instantiate the corresponding MarginfiAccount.
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
   * Marginfi account group address
   */
  get group(): MarginfiGroup {
    return this._group;
  }

  // --- Others

  /**
   * Create a new marginfi account under the authority of the user.
   *
   * @returns MarginfiAccount instance
   */
  async createMarginfiAccount(): Promise<MarginfiAccount> {
    const dbg = require("debug")("mfi:client");
    const marginfiAccountKey = Keypair.generate();

    dbg("Creating Marginfi account %s", marginfiAccountKey.publicKey);

    const createMarginfiAccountAccountIx = await this.program.account.marginfiAccount.createInstruction(
      marginfiAccountKey
    );
    const initMarginfiAccountIx = await makeInitMarginfiAccountIx(this.program, {
      marginfiGroupPk: this._group.publicKey,
      marginfiAccountPk: marginfiAccountKey.publicKey,
      authorityPk: this.program.provider.wallet.publicKey,
    });

    const ixs = [createMarginfiAccountAccountIx, initMarginfiAccountIx];

    const tx = new Transaction().add(...ixs);
    const sig = await processTransaction(this.program.provider, tx, [marginfiAccountKey]);

    dbg("Created Marginfi account %s", sig);

    return MarginfiAccount.get(marginfiAccountKey.publicKey, this);
  }

  /**
   * Retrieves all marginfi accounts under the authority of the user.
   *
   * @returns MarginfiAccount instances
   */
  async getOwnMarginfiAccounts(): Promise<MarginfiAccount[]> {
    const marginfiGroup = await MarginfiGroup.get(this.config, this.program);
    return (
      await this.program.account.marginfiAccount.all([
        {
          memcmp: {
            bytes: this.program.provider.wallet.publicKey.toBase58(),
            offset: 8, // authority is the first field in the account, so only offset is the discriminant
          },
        },
        {
          memcmp: {
            bytes: this._group.publicKey.toBase58(),
            offset: 8 + 32, // marginfi_group is the second field in the account after the authority, so offset by the discriminant and a pubkey
          },
        },
      ])
    ).map((a) => MarginfiAccount.fromAccountData(a.publicKey, this, a.account as MarginfiAccountData, marginfiGroup));
  }

  /**
   * Retrieves all marginfi accounts in the underlying group.
   *
   * @returns MarginfiAccount instances
   */
  async getAllMarginfiAccounts(): Promise<MarginfiAccount[]> {
    const marginfiGroup = await MarginfiGroup.get(this.config, this.program);
    const marginfiAccountAddresses = await this.getAllMarginfiAccountAddresses();

    return (await this.program.account.marginfiAccount.fetchMultiple(marginfiAccountAddresses))
      .filter((a) => a !== null)
      .map((account, i) =>
        MarginfiAccount.fromAccountData(
          marginfiAccountAddresses[i],
          this,
          account as MarginfiAccountData,
          marginfiGroup
        )
      );
  }

  async getMarginfiAccount(address: PublicKey): Promise<MarginfiAccount> {
    return MarginfiAccount.get(address, this);
  }

  /**
   * Retrieves the addresses of all marginfi accounts in the udnerlying group.
   *
   * @returns Account addresses
   */
  async getAllMarginfiAccountAddresses(): Promise<PublicKey[]> {
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
              offset: 8 + 32, // marginfi_group is the second field in the account after the authority, so offset by the discriminant and a pubkey
            },
          },
          {
            memcmp: {
              offset: 0,
              bytes: bs58.encode(BorshAccountsCoder.accountDiscriminator(AccountType.MarginfiAccount)),
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
