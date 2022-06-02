import { MarginfiConfig } from './config';
import { MarginfiIdl, MARGINFI_IDL } from './idl';
import { BorshCoder, Program } from '@project-serum/anchor';
import { PublicKey, Transaction } from '@solana/web3.js';
import { makeUpdateInterestAccumulatorIx } from './instruction';
import { Bank } from './state';
import { AccountType, MarginfiGroupData } from './types';
import { getBankAuthority, processTransaction } from './utils';

/**
 * Wrapper class around a specific marginfi group.
 */
export class MarginfiGroup {
  private _program: Program<MarginfiIdl>;
  private _config: MarginfiConfig;

  public readonly publicKey: PublicKey;
  private _admin: PublicKey;
  private _bank: Bank;

  /**
   * @internal
   */
  private constructor(
    config: MarginfiConfig,
    program: Program<MarginfiIdl>,
    admin: PublicKey,
    bank: Bank
  ) {
    this.publicKey = config.groupPk;
    this._config = config;
    this._program = program;
    this._admin = admin;
    this._bank = bank;
  }

  // --- Factories

  /**
   * MarginfiGroup network factory
   *
   * Fetch account data according to the config and instantiate the corresponding MarginfiGroup.
   *
   * @param config marginfi config
   * @param program marginfi Anchor program
   * @return MarginfiGroup instance
   */
  static async get(config: MarginfiConfig, program: Program<MarginfiIdl>) {
    const accountData = await MarginfiGroup._fetchAccountData(config, program);
    return new MarginfiGroup(
      config,
      program,
      accountData.admin,
      Bank.from(accountData.bank)
    );
  }

  /**
   * MarginfiGroup local factory (decoded)
   *
   * Instantiate a MarginfiGroup according to the provided decoded data.
   * Check sanity against provided config.
   *
   * @param config marginfi config
   * @param program marginfi Anchor program
   * @param accountData Decoded marginfi group data
   * @return MarginfiGroup instance
   */
  static fromAccountData(
    config: MarginfiConfig,
    program: Program<MarginfiIdl>,
    accountData: MarginfiGroupData
  ) {
    if (!accountData.bank.mint.equals(config.collateralMintPk))
      throw Error(
        `Marginfi group uses collateral ${accountData.bank.mint.toBase58()}. Expected: ${config.collateralMintPk.toBase58()}`
      );

    return new MarginfiGroup(
      config,
      program,
      accountData.admin,
      Bank.from(accountData.bank)
    );
  }

  /**
   * MarginfiGroup local factory (encoded)
   *
   * Instantiate a MarginfiGroup according to the provided encoded data.
   * Check sanity against provided config.
   *
   * @param config marginfi config
   * @param program marginfi Anchor program
   * @param data Encoded marginfi group data
   * @return MarginfiGroup instance
   */
  static fromAccountDataRaw(
    config: MarginfiConfig,
    program: Program<MarginfiIdl>,
    rawData: Buffer
  ) {
    const data = MarginfiGroup.decode(rawData);
    return MarginfiGroup.fromAccountData(config, program, data);
  }

  // --- Getters and setters

  /**
   * marginfi group admin address
   */
  get admin(): PublicKey {
    return this._admin;
  }

  /**
   * marginfi group Bank
   */
  get bank(): Bank {
    return this._bank;
  }

  // --- Others

  /**
   * Fetch marginfi group account data according to the config.
   * Check sanity against provided config.
   *
   * @param config marginfi config
   * @param program marginfi Anchor program
   * @return Decoded marginfi group account data struct
   */
  private static async _fetchAccountData(
    config: MarginfiConfig,
    program: Program<MarginfiIdl>
  ): Promise<MarginfiGroupData> {
    const data: MarginfiGroupData = (await program.account.marginGroup.fetch(
      config.groupPk
    )) as any;

    if (!data.bank.mint.equals(config.collateralMintPk))
      throw Error(
        `Marginfi group uses collateral ${data.bank.mint.toBase58()}. Expected: ${config.collateralMintPk.toBase58()}`
      );

    return data;
  }

  /**
   * Decode marginfi group account data according to the Anchor IDL.
   *
   * @param encoded Raw data buffer
   * @return Decoded marginfi group account data struct
   */
  static decode(encoded: Buffer): MarginfiGroupData {
    const coder = new BorshCoder(MARGINFI_IDL);
    return coder.accounts.decode(AccountType.MarginfiGroup, encoded);
  }

  /**
   * Encode marginfi group account data according to the Anchor IDL.
   *
   * @param decoded Encoded marginfi group account data buffer
   * @return Raw data buffer
   */
  static async encode(decoded: MarginfiGroupData): Promise<Buffer> {
    const coder = new BorshCoder(MARGINFI_IDL);
    return await coder.accounts.encode(AccountType.MarginfiGroup, decoded);
  }

  /**
   * Update instance data by fetching and storing the latest on-chain state.
   */
  async fetch() {
    const data = await MarginfiGroup._fetchAccountData(
      this._config,
      this._program
    );
    this._admin = data.admin;
    this._bank = Bank.from(data.bank);
  }

  /**
   * Create `UpdateInterestAccumulator` transaction instruction.
   */
  async makeUpdateInterestAccumulatorIx() {
    let [ bankAuthority, _ ] = await getBankAuthority(this._config.groupPk, this._program.programId);
    return makeUpdateInterestAccumulatorIx(this._program, {
      marginfiGroupPk: this.publicKey,
      bankVault: this.bank.vault,
      bankAuthority,
      bankFeeVault: this.bank.feeVault
    });
  }

  /**
   * Update interest accumulator.
   */
  async updateInterestAccumulator() {
    const tx = new Transaction().add(
      await this.makeUpdateInterestAccumulatorIx()
    );
    return await processTransaction(this._program.provider, tx);
  }
}
