import { MarginfiConfig } from './config';
import { MARGINFI_IDL, MarginfiIdl } from './idl';
import { Wallet } from '.';
import { Program, Provider, BorshAccountsCoder } from '@project-serum/anchor';
import {
  ConfirmOptions,
  Connection,
  Keypair,
  PublicKey,
  Transaction,
} from '@solana/web3.js';
import { MarginfiGroup } from './marginfiGroup';
import { makeInitMarginAccountIx } from './instruction';
import { processTransaction } from './utils';
import { MarginAccount } from './marginAccount';
import { AccountType, MarginAccountData } from './types';
import { bs58 } from '@project-serum/anchor/dist/cjs/utils/bytes';

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
  private constructor(
    config: MarginfiConfig,
    program: Program<MarginfiIdl>,
    group: MarginfiGroup
  ) {
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
  static async get(
    config: MarginfiConfig,
    wallet: Wallet,
    connection: Connection,
    opts?: ConfirmOptions
  ) {
    const provider = new Provider(
      connection,
      wallet,
      opts || Provider.defaultOptions()
    );
    const program = new Program(
      MARGINFI_IDL,
      config.programId,
      provider
    ) as Program<MarginfiIdl>;
    return new MarginfiClient(
      config,
      program,
      await MarginfiGroup.get(config, program)
    );
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
    const marginAccountKey = Keypair.generate();

    const createMarginAccountAccountIx =
      await this.program.account.marginAccount.createInstruction(
        marginAccountKey
      );
    const initMarginAccountIx = await makeInitMarginAccountIx(this.program, {
      marginfiGroupPk: this._group.publicKey,
      marginAccountPk: marginAccountKey.publicKey,
      authorityPk: this.program.provider.wallet.publicKey,
    });

    const ixs = [createMarginAccountAccountIx, initMarginAccountIx];

    const tx = new Transaction().add(...ixs);
    const sig = await processTransaction(this.program.provider, tx, [
      marginAccountKey,
    ]);
    console.log(`Margin account created: ${sig}`);

    return MarginAccount.get(
      marginAccountKey.publicKey,
      this.config,
      this.program
    );
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
      ])
    )
      .filter((a) =>
        a.account.authority.equals(this.program.provider.wallet.publicKey)
      )
      .filter((a) => a.account.marginGroup.equals(this.config.groupPk))
      .map((a) =>
        MarginAccount.fromAccountData(
          a.publicKey,
          this.config,
          this.program,
          a.account as MarginAccountData,
          marginfiGroup
        )
      );
  }

  /**
   * Retrieves the addresses of all accounts owned by the marginfi program.
   *
   * @returns Account addresses
   */
  async getAllProgramAccountAddresses(type: AccountType): Promise<PublicKey[]> {
    return (
      await this.program.provider.connection.getProgramAccounts(
        this.programId,
        {
          commitment: this.program.provider.connection.commitment,
          dataSlice: {
            offset: 0,
            length: 0,
          },
          filters: [
            {
              memcmp: {
                offset: 0,
                bytes: bs58.encode(
                  BorshAccountsCoder.accountDiscriminator(type)
                ),
              },
            },
          ],
        }
      )
    ).map((a) => a.pubkey);
  }
}
