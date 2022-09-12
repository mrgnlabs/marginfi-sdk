import { AnchorProvider, BorshAccountsCoder, Program } from "@project-serum/anchor";
import { bs58 } from "@project-serum/anchor/dist/cjs/utils/bytes";
import { ConfirmOptions, Connection, Keypair, PublicKey, Transaction } from "@solana/web3.js";
import { getConfig, Wallet } from ".";
import MarginfiAccount from "./account";
import MarginfiGroup from "./group";
import { MARGINFI_IDL } from "./idl";
import instruction from "./instructions";
import { NodeWallet } from "./nodeWallet";
import {
  AccountType,
  Environment,
  InstructionsWrapper,
  MarginfiAccountData,
  MarginfiAccountType,
  MarginfiConfig,
  MarginfiProgram,
} from "./types";
import { getEnvFromStr, loadKeypair, processTransaction } from "./utils";

/**
 * Entrypoint to interact with the marginfi contract.
 */
class MarginfiClient {
  public readonly program: MarginfiProgram;
  public readonly config: MarginfiConfig;

  public readonly programId: PublicKey;
  private _group: MarginfiGroup;

  /**
   * @internal
   */
  private constructor(config: MarginfiConfig, program: MarginfiProgram, group: MarginfiGroup) {
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
  static async fetch(config: MarginfiConfig, wallet: Wallet, connection: Connection, opts?: ConfirmOptions) {
    const debug = require("debug")("mfi:client");
    debug(
      "Loading Marginfi Client\n\tprogram: %s\n\tenv: %s\n\tgroup: %s\n\turl: %s",
      config.programId,
      config.environment,
      config.groupPk,
      connection.rpcEndpoint
    );
    const provider = new AnchorProvider(connection, wallet, opts || AnchorProvider.defaultOptions());
    const program = new Program(MARGINFI_IDL, config.programId, provider) as any as MarginfiProgram;
    return new MarginfiClient(config, program, await MarginfiGroup.fetch(config, program));
  }

  static async fromEnv(
    overrides?: Partial<{
      env: Environment;
      connection: Connection;
      programId: PublicKey;
      marginfiGroup: PublicKey;
      wallet: Wallet;
    }>
  ): Promise<MarginfiClient> {
    const debug = require("debug")("mfi:client");
    const env = overrides?.env ?? getEnvFromStr(process.env.ENV!);
    const connection = overrides?.connection ?? new Connection(process.env.RPC_ENDPOINT!, { commitment: "confirmed" });
    const programId = overrides?.programId ?? new PublicKey(process.env.MARGINFI_PROGRAM!);
    const groupPk =
      overrides?.marginfiGroup ??
      (process.env.MARGINFI_GROUP ? new PublicKey(process.env.MARGINFI_GROUP) : PublicKey.default);
    const wallet =
      overrides?.wallet ??
      new NodeWallet(
        process.env.WALLET_KEY
          ? Keypair.fromSecretKey(new Uint8Array(JSON.parse(process.env.WALLET_KEY)))
          : loadKeypair(process.env.WALLET!)
      );

    debug("Loading the marginfi client from env vars");
    debug("Env: %s\nProgram: %s\nGroup: %s\nSigner: %s", env, programId, groupPk, wallet.publicKey);

    const config = await getConfig(env, {
      groupPk,
      programId,
    });

    return MarginfiClient.fetch(config, wallet, connection, { commitment: connection.commitment });
  }

  // --- Getters and setters

  /**
   * Marginfi account group address
   */
  get group(): MarginfiGroup {
    return this._group;
  }

  get provider(): AnchorProvider {
    return this.program.provider as AnchorProvider;
  }

  // --- Others

  /**
   * Create transaction instruction to create a new marginfi account under the authority of the user.
   *
   * @returns transaction instruction
   */
  async makeCreateMarginfiAccountIx(marginfiAccountKeypair?: Keypair): Promise<InstructionsWrapper> {
    const dbg = require("debug")("mfi:client");
    const accountKeypair = marginfiAccountKeypair || Keypair.generate();

    dbg("Generating marginfi account ix for %s", accountKeypair.publicKey);

    const createMarginfiAccountAccountIx = await this.program.account.marginfiAccount.createInstruction(accountKeypair);
    const initMarginfiAccountIx = await instruction.makeInitMarginfiAccountIx(this.program, {
      marginfiGroupPk: this._group.publicKey,
      marginfiAccountPk: accountKeypair.publicKey,
      authorityPk: this.provider.wallet.publicKey,
    });

    const ixs = [createMarginfiAccountAccountIx, initMarginfiAccountIx];

    return {
      instructions: ixs,
      keys: [accountKeypair],
    };
  }

  /**
   * Create transaction instruction to create a new marginfi account under the authority of the user.
   *
   * @returns transaction instruction
   */
  async makeCreateMarginfiAccountWithTypeIx(
    accountType: MarginfiAccountType,
    marginfiAccountKeypair?: Keypair
  ): Promise<InstructionsWrapper> {
    const dbg = require("debug")("mfi:client");
    const accountKeypair = marginfiAccountKeypair || Keypair.generate();

    dbg("Generating marginfi account ix for %s", accountKeypair.publicKey);

    const createMarginfiAccountAccountIx = await this.program.account.marginfiAccount.createInstruction(accountKeypair);
    const initMarginfiAccountIx = await instruction.makeInitMarginfiAccountWithTypeIx(
      this.program,
      {
        marginfiGroupPk: this._group.publicKey,
        marginfiAccountPk: accountKeypair.publicKey,
        authorityPk: this.provider.wallet.publicKey,
      },
      { accountType }
    );

    const ixs = [createMarginfiAccountAccountIx, initMarginfiAccountIx];

    return {
      instructions: ixs,
      keys: [accountKeypair],
    };
  }

  /**
   * Create a new marginfi account under the authority of the user.
   *
   * @returns MarginfiAccount instance
   */
  async createMarginfiAccount(): Promise<MarginfiAccount> {
    const dbg = require("debug")("mfi:client");
    const marginfiAccountKey = Keypair.generate();

    dbg("Generating Marginfi account ix for %s", marginfiAccountKey.publicKey);

    const createMarginfiAccountAccountIx = await this.program.account.marginfiAccount.createInstruction(
      marginfiAccountKey
    );
    const initMarginfiAccountIx = await instruction.makeInitMarginfiAccountIx(this.program, {
      marginfiGroupPk: this._group.publicKey,
      marginfiAccountPk: marginfiAccountKey.publicKey,
      authorityPk: this.provider.wallet.publicKey,
    });

    const ixs = [createMarginfiAccountAccountIx, initMarginfiAccountIx];

    const tx = new Transaction().add(...ixs);
    const sig = await processTransaction(this.provider, tx, [marginfiAccountKey]);

    dbg("Created Marginfi account %s", sig);

    return MarginfiAccount.fetch(marginfiAccountKey.publicKey, this);
  }

  /**
   * Create a new marginfi account under the authority of the user.
   *
   * @returns MarginfiAccount instance
   */
  async createMarginfiAccountWithType(accountType: MarginfiAccountType): Promise<MarginfiAccount> {
    const dbg = require("debug")("mfi:client");
    const marginfiAccountKey = Keypair.generate();

    dbg("Generating Marginfi account ix for %s", marginfiAccountKey.publicKey);

    const ixw = await this.makeCreateMarginfiAccountWithTypeIx(accountType, marginfiAccountKey);
    const tx = new Transaction().add(...ixw.instructions);
    const sig = await processTransaction(this.provider, tx, [...ixw.keys]);

    dbg("Created Marginfi account %s", sig);

    return MarginfiAccount.fetch(marginfiAccountKey.publicKey, this);
  }

  /**
   * Retrieves all marginfi accounts under the authority of the user.
   *
   * @returns MarginfiAccount instances
   */
  async getOwnMarginfiAccounts(): Promise<MarginfiAccount[]> {
    const marginfiGroup = await MarginfiGroup.fetch(this.config, this.program);
    return (
      await this.program.account.marginfiAccount.all([
        {
          memcmp: {
            bytes: this.provider.wallet.publicKey.toBase58(),
            offset: 8, // authority is the first field in the account, so only offset is the discriminant
          },
        },
        {
          memcmp: {
            bytes: this._group.publicKey.toBase58(),
            offset: 8 + 32, // marginfiGroup is the second field in the account after the authority, so offset by the discriminant and a pubkey
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
    const marginfiGroup = await MarginfiGroup.fetch(this.config, this.program);
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
    return MarginfiAccount.fetch(address, this);
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
              offset: 8 + 32, // marginfiGroup is the second field in the account after the authority, so offset by the discriminant and a pubkey
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

export default MarginfiClient;
