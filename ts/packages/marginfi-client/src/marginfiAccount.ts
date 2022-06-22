import {
  create_observer,
  get_margin_requirement,
  get_max_rebalance_deposit_amount,
  get_max_rebalance_withdraw_amount,
  get_quote_balance,
  inject_observation_into_observer,
  is_bankrupt,
  liquidation_valid,
  rebalance_deposit_valid,
  rebalance_withdraw_valid,
  WasmMarginRequirement,
} from "@mrgnlabs/marginfi-wasm-tools";
import { BN, BorshCoder, Program } from "@project-serum/anchor";
import { associatedAddress } from "@project-serum/anchor/dist/cjs/utils/token";
import { AccountInfo, AccountMeta, PublicKey, Transaction } from "@solana/web3.js";
import { toBufferBE } from "bigint-buffer";
import { MarginfiClient } from ".";
import { MarginfiConfig } from "./config";
import { MarginfiIdl, MARGINFI_IDL } from "./idl";
import {
  makeDeactivateUtpIx,
  makeDepositIx,
  makeHandleBankruptcyIx,
  makeLiquidateIx,
  makeWithdrawIx,
} from "./instruction";
import { MarginfiGroup } from "./marginfiGroup";
import { AccountType, IndexedObservation, MarginfiAccountData, UtpAccount, UtpData } from "./types";
import {
  BankVaultType,
  Decimal,
  decimalToNative,
  getBankAuthority,
  mDecimalToNative,
  processTransaction,
  wasmDecimalToNative,
} from "./utils";
import { UtpMangoAccount } from "./utp/mango";
import { UtpZoAccount } from "./utp/zo";

/**
 * Wrapper class around a specific marginfi marginfi account.
 */
export class MarginfiAccount {
  public readonly publicKey: PublicKey;

  private _authority: PublicKey;
  private _group: MarginfiGroup;
  private _depositRecord: BN;
  private _borrowRecord: BN;
  private _client: MarginfiClient;

  public readonly mango: UtpMangoAccount;
  public readonly zo: UtpZoAccount;

  allUtps(): UtpAccount[] {
    return [this.mango, this.zo]; // *Must* be sorted according to UTP indices
  }

  activeUtps(): UtpAccount[] {
    return this.allUtps().filter((utp) => utp.isActive);
  }

  get client() {
    return this._client;
  }

  /**
   * @internal
   */
  private constructor(
    marginfiAccountPk: PublicKey,
    authority: PublicKey,
    client: MarginfiClient,
    group: MarginfiGroup,
    depositRecord: BN,
    borrowRecord: BN,
    mangoUtpData: UtpData,
    zoUtpData: UtpData
  ) {
    this.publicKey = marginfiAccountPk;
    this._client = client;

    this.mango = new UtpMangoAccount(client, this, mangoUtpData);
    this.zo = new UtpZoAccount(client, this, zoUtpData);

    this._authority = authority;
    this._group = group;
    this._depositRecord = depositRecord;
    this._borrowRecord = borrowRecord;
  }

  // --- Factories

  /**
   * MarginfiAccount network factory
   *
   * Fetch account data according to the config and instantiate the corresponding MarginfiAccount.
   *
   * @param marginfiAccountPk Address of the target account
   * @param client marginfi client
   * @returns MarginfiAccount instance
   */
  static async get(marginfiAccountPk: PublicKey, client: MarginfiClient): Promise<MarginfiAccount> {
    const { config, program } = client;

    const accountData = await MarginfiAccount._fetchAccountData(marginfiAccountPk, config, program);
    const marginfiAccount = new MarginfiAccount(
      marginfiAccountPk,
      accountData.authority,
      client,
      await MarginfiGroup.get(config, program),
      mDecimalToNative(accountData.depositRecord),
      mDecimalToNative(accountData.borrowRecord),
      MarginfiAccount._packUtpData(accountData, config.mango.utpIndex),
      MarginfiAccount._packUtpData(accountData, config.zo.utpIndex)
    );

    require("debug")("mfi:margin-account")("Loaded marginfi account %s", marginfiAccountPk);

    return marginfiAccount;
  }

  private get _program() {
    return this._client.program;
  }

  private get _config() {
    return this._client.config;
  }

  /**
   * MarginfiAccount local factory (decoded)
   *
   * Instantiate a MarginfiAccount according to the provided decoded data.
   * Check sanity against provided config.
   *
   * @param marginfiAccountPk Address of the target account
   * @param client marginfi client
   * @param accountData Decoded marginfi marginfi account data
   * @param marginfiGroup MarginfiGroup instance
   * @returns MarginfiAccount instance
   */
  static fromAccountData(
    marginfiAccountPk: PublicKey,
    client: MarginfiClient,
    accountData: MarginfiAccountData,
    marginfiGroup: MarginfiGroup
  ) {
    if (!accountData.marginfiGroup.equals(client.config.groupPk))
      throw Error(
        `Marginfi account tied to group ${accountData.marginfiGroup.toBase58()}. Expected: ${client.config.groupPk.toBase58()}`
      );

    return new MarginfiAccount(
      marginfiAccountPk,
      accountData.authority,
      client,
      marginfiGroup,
      mDecimalToNative(accountData.depositRecord),
      mDecimalToNative(accountData.borrowRecord),
      MarginfiAccount._packUtpData(accountData, client.config.mango.utpIndex),
      MarginfiAccount._packUtpData(accountData, client.config.zo.utpIndex)
    );
  }

  /**
   * MarginfiAccount local factory (encoded)
   *
   * Instantiate a MarginfiAccount according to the provided encoded data.
   * Check sanity against provided config.
   *
   * @param marginfiAccountPk Address of the target account
   * @param config marginfi config
   * @param program marginfi Anchor program
   * @param marginfiAccountRawData Encoded marginfi marginfi account data
   * @param marginfiGroup MarginfiGroup instance
   * @returns MarginfiAccount instance
   */
  static fromAccountDataRaw(
    marginfiAccountPk: PublicKey,
    client: MarginfiClient,
    marginfiAccountRawData: Buffer,
    marginfiGroup: MarginfiGroup
  ) {
    const marginfiAccountData = MarginfiAccount.decode(marginfiAccountRawData);

    return MarginfiAccount.fromAccountData(marginfiAccountPk, client, marginfiAccountData, marginfiGroup);
  }

  // --- Getters and setters

  /**
   * Marginfi account authority address
   */
  get authority(): PublicKey {
    return this._authority;
  }

  /**
   * Marginfi account group address
   */
  get group(): MarginfiGroup {
    return this._group;
  }

  /**
   * Marginfi account deposit
   */
  get depositRecord(): BN {
    return this._depositRecord;
  }

  /**
   * Marginfi account debt
   */
  get borrowRecord(): BN {
    return this._borrowRecord;
  }

  // --- Others

  /**
   * Fetch marginfi account data.
   * Check sanity against provided config.
   *
   * @param config marginfi config
   * @param program marginfi Anchor program
   * @returns Decoded marginfi account data struct
   */
  private static async _fetchAccountData(
    accountAddress: PublicKey,
    config: MarginfiConfig,
    program: Program<MarginfiIdl>
  ): Promise<MarginfiAccountData> {
    const data: MarginfiAccountData = (await program.account.marginfiAccount.fetch(accountAddress)) as any;

    if (!data.marginfiGroup.equals(config.groupPk))
      throw Error(
        `Marginfi account tied to group ${data.marginfiGroup.toBase58()}. Expected: ${config.groupPk.toBase58()}`
      );

    return data;
  }

  /**
   * Pack data from the on-chain, vector format into a coherent unit.
   *
   * @param data Marginfi account data
   * @param utpIndex Index of the target UTP
   * @returns UTP data struct
   */
  private static _packUtpData(data: MarginfiAccountData, utpIndex: number): UtpData {
    return {
      accountConfig: data.utpAccountConfig[utpIndex],
      isActive: data.activeUtps[utpIndex],
    };
  }

  /**
   * Decode marginfi account data according to the Anchor IDL.
   *
   * @param encoded Raw data buffer
   * @returns Decoded marginfi account data struct
   */
  static decode(encoded: Buffer): MarginfiAccountData {
    const coder = new BorshCoder(MARGINFI_IDL);
    return coder.accounts.decode(AccountType.MarginfiAccount, encoded);
  }

  /**
   * Decode marginfi account data according to the Anchor IDL.
   *
   * @param decoded Marginfi account data struct
   * @returns Raw data buffer
   */
  static async encode(decoded: MarginfiAccountData): Promise<Buffer> {
    const coder = new BorshCoder(MARGINFI_IDL);
    return await coder.accounts.encode(AccountType.MarginfiAccount, decoded);
  }

  /**
   * Update instance data by fetching and storing the latest on-chain state.
   */
  async reload() {
    require("debug")(`mfi:margin-account:${this.publicKey.toString()}:loader`)("Reloading account data");
    const data = await MarginfiAccount._fetchAccountData(this.publicKey, this._config, this._program);
    this._group = await MarginfiGroup.get(this._config, this._program);
    this._updateFromAccountData(data);
  }

  /**
   * Update instance data from provided data struct.
   *
   * @param data Marginfi account data struct
   */
  private _updateFromAccountData(data: MarginfiAccountData) {
    this._authority = data.authority;
    this._depositRecord = mDecimalToNative(data.depositRecord);
    this._borrowRecord = mDecimalToNative(data.borrowRecord);

    this.mango.update(MarginfiAccount._packUtpData(data, this._config.mango.utpIndex));
    this.zo.update(MarginfiAccount._packUtpData(data, this._config.zo.utpIndex));
  }

  /**
   * Create transaction instruction to deposit collateral into the marginfi account.
   *
   * @param amount Amount to deposit (mint native unit)
   * @returns `MarginDepositCollateral` transaction instruction
   */
  async makeDepositIx(amount: BN) {
    const userTokenAtaPk = await associatedAddress({
      mint: this._group.bank.mint,
      owner: this._program.provider.wallet.publicKey,
    });

    return makeDepositIx(
      this._program,
      {
        marginfiGroupPk: this._group.publicKey,
        marginfiAccountPk: this.publicKey,
        authorityPk: this._program.provider.wallet.publicKey,
        userTokenAtaPk,
        bankVaultPk: this._group.bank.vault,
      },
      { amount }
    );
  }

  /**
   * Deposit collateral into the marginfi account.
   *
   * @param amount Amount to deposit (mint native unit)
   * @returns Transaction signature
   */
  async deposit(amount: BN): Promise<string> {
    const debug = require("debug")(`mfi:margin-account:${this.publicKey.toString()}:deposit`);

    debug("Depositing %s into marginfi account", amount);
    const depositIx = await this.makeDepositIx(amount);
    const tx = new Transaction().add(depositIx);
    const sig = await processTransaction(this._program.provider, tx);
    debug("Depositing successful %s", sig);
    await this.reload();
    return sig;
  }

  /**
   * Create transaction instruction to withdraw collateral from the marginfi account.
   *
   * @param amount Amount to withdraw (mint native unit)
   * @returns `MarginWithdrawCollateral` transaction instruction
   */
  async makeWithdrawIx(amount: BN) {
    const userTokenAtaPk = await associatedAddress({
      mint: this._group.bank.mint,
      owner: this._program.provider.wallet.publicKey,
    });
    const [marginBankAuthorityPk] = await getBankAuthority(this._config.groupPk, this._program.programId);
    const remainingAccounts = await this.getObservationAccounts();
    return makeWithdrawIx(
      this._program,
      {
        marginfiGroupPk: this._group.publicKey,
        marginfiAccountPk: this.publicKey,
        authorityPk: this._program.provider.wallet.publicKey,
        receivingTokenAccount: userTokenAtaPk,
        bankVaultPk: this._group.bank.vault,
        bankVaultAuthorityPk: marginBankAuthorityPk,
      },
      { amount },
      remainingAccounts
    );
  }

  /**
   * Withdraw collateral from the marginfi account.
   *
   * @param amount Amount to withdraw (mint native unit)
   * @returns Transaction signature
   */
  async withdraw(amount: BN): Promise<string> {
    const debug = require("debug")(`mfi:margin-account:${this.publicKey.toString()}:withdraw`);

    debug("Withdrawing %s from marginfi account", amount);
    const withdrawIx = await this.makeWithdrawIx(amount);
    const tx = new Transaction().add(withdrawIx);
    const sig = await processTransaction(this._program.provider, tx);
    debug("Withdrawing successful %s", sig);
    await this.reload();
    return sig;
  }

  /**
   * Create transaction instruction to deactivate the target UTP.
   *
   * @param utpIndex Target UTP index
   * @returns `DeactivateUtp` transaction instruction
   *
   * @internal
   */
  async makeDeactivateUtpIx(utpIndex: BN) {
    const remainingAccounts = await this.getObservationAccounts();
    return makeDeactivateUtpIx(
      this._program,
      {
        marginfiAccountPk: this.publicKey,
        authorityPk: this._program.provider.wallet.publicKey,
      },
      { utpIndex },
      remainingAccounts
    );
  }

  /**
   * Deactivate the target UTP.
   *
   * @param utpIndex Target UTP index
   * @returns Transaction signature
   *
   * @internal
   */
  async deactivateUtp(utpIndex: BN) {
    const verifyIx = await this.makeDeactivateUtpIx(utpIndex);
    const tx = new Transaction().add(verifyIx);
    return processTransaction(this._program.provider, tx);
  }

  /**
   * Create transaction instruction to handle a bankrupt account.
   *
   * @returns `HandleBankruptcy` transaction instruction
   */
  async makeHandleBankruptcyIx() {
    const remainingAccounts = await this.getObservationAccounts();
    const insuranceVaultAuthorityPk = (
      await getBankAuthority(this._group.publicKey, this._program.programId, BankVaultType.InsuranceVault)
    )[0];
    return makeHandleBankruptcyIx(
      this._program,
      {
        marginfiAccountPk: this.publicKey,
        marginfiGroupPk: this._group.publicKey,
        insuranceVaultAuthorityPk,
        insuranceVaultPk: this._group.bank.insuranceVault,
        liquidityVaultPk: this._group.bank.vault,
      },
      remainingAccounts
    );
  }

  /**
   * Handle a bankrupt account.
   *
   * @returns Transaction signature
   */
  async handleBankruptcy() {
    const handleBankruptcyIx = await this.makeHandleBankruptcyIx();
    const tx = new Transaction().add(handleBankruptcyIx);
    return processTransaction(this._program.provider, tx);
  }

  /**
   * Create ordered list of account metas required to observe all active UTPs.
   *
   * @returns `AccountMeta[]` list of account metas
   */
  async getObservationAccounts(): Promise<AccountMeta[]> {
    const debug = require("debug")("mfi:obs-account-loader");
    let accounts = (
      await Promise.all(this.activeUtps().map(async (utp) => await utp.getObservationAccounts()))
    ).flatMap((a) => a);

    debug("Loading %s observation accounts", accounts.length); 

    return accounts;
  }

  /**
   * Refresh and retrieve the health cache for all active UTPs directly from the UTPs.
   *
   * @returns List of health caches for all active UTPs
   */
  async observe(): Promise<IndexedObservation[]> {
    const debug = require("debug")(`mfi:margin-account:${this.publicKey.toString()}:observe`);
    debug("Observing UTP Accounts");
    return Promise.all(
      this.activeUtps().map(async (utp) => ({
        utp_index: utp.index,
        observation: await utp.observe(),
      }))
    );
  }

  private async getObserver(observations?: IndexedObservation[]): Promise<Uint8Array> {
    let observer = create_observer();

    if (!observations) {
      observations = await this.observe();
    }

    for (let observation of observations) {
      observer = inject_observation_into_observer(observer, observation.observation.toWasm(), observation.utp_index);
    }

    return observer;
  }

  /**
   * Retrieve the UTP interface instance from its index
   *
   * @param utpIndex UTP index
   * @returns UTP interface instance
   */
  private utpFromIndex(utpIndex: number): UtpAccount {
    if (utpIndex >= this.allUtps().length) {
      throw Error(`Unsupported UTP ${utpIndex} (${this.allUtps().length} UTPs supported)`);
    }
    return this.allUtps()[utpIndex];
  }

  async checkRebalance() {
    require("debug")(`mfi:margin-account:${this.publicKey.toString()}:rebalance`)("Checking rebalance");
    await this.checkRebalanceDeposit();
    await this.checkRebalanceWithdraw();
  }

  private async checkRebalanceWithdraw() {
    const debug = require("debug")(`mfi:margin-account:${this.publicKey.toString()}:rebalance:withdraw`);
    debug("Checking withdraw rebalance");

    let [marginfiGroupAi, marginfiAccountAi] = await this.loadAccountAndGroupAi();

    if (!marginfiAccountAi) {
      throw Error("Marginfi account no found");
    }
    if (!marginfiGroupAi) {
      throw Error("Marginfi Group Account no found");
    }

    const observations = await this.observe();

    let observer = await this.getObserver(observations);

    const rebalanceNeeded = rebalance_withdraw_valid(marginfiAccountAi.data, marginfiGroupAi.data, observer);

    if (!rebalanceNeeded) {
      return;
    }

    debug("Rebalance withdraw required");

    const richestUtpObservation = observations.reduce((a, b) =>
      a.observation.freeCollateral < b.observation.freeCollateral ? a : b
    );
    const withdrawAmountDecimal = Decimal.fromWasm(
      get_max_rebalance_withdraw_amount(
        richestUtpObservation.observation.toWasm(),
        marginfiAccountAi.data,
        marginfiGroupAi.data,
        observer
      )
    );

    debug(
      "Trying to rebalance withdraw UTP:%s, amount %s (RBWA)",
      richestUtpObservation.utp_index,
      withdrawAmountDecimal
    );

    try {
      const sig = await this.utpFromIndex(richestUtpObservation.utp_index).withdraw(
        decimalToNative(withdrawAmountDecimal)
      );
      debug("Rebalance withdraw success - sig %s (RBWS)", sig);
    } catch (e) {
      debug("Rebalance withdraw failed (RBWF)");
      console.error(e);
    }
  }

  private async checkRebalanceDeposit() {
    let debug = require("debug")(`mfi:margin-account:${this.publicKey.toString()}:rebalance:deposit`);
    debug("Checking deposit rebalance");
    let [marginfiGroupAi, marginfiAccountAi] = await this._program.provider.connection.getMultipleAccountsInfo([
      this._config.groupPk,
      this.publicKey,
    ]);

    if (!marginfiAccountAi) {
      throw Error("Marginfi account no found");
    }
    if (!marginfiGroupAi) {
      throw Error("Marginfi Group Account no found");
    }

    const indexed_observations = await this.observe();
    const observer = await this.getObserver(indexed_observations);

    debug("Loaded %s observations", indexed_observations.length);
    for (let indexed_observation of indexed_observations) {
      let { utp_index, observation } = indexed_observation;
      let debug = require("debug")(
        `mfi:margin-account:${this.publicKey.toString()}:rebalance:deposit:utp:${utp_index}`
      );
      debug(observation.toString());

      if (!observation.valid) {
        continue;
      }
      if (!rebalance_deposit_valid(observation.toWasm())) {
        continue;
      }

      let rebalanceAmountDecimal = get_max_rebalance_deposit_amount(
        observation.toWasm(),
        marginfiAccountAi!.data,
        marginfiGroupAi!.data,
        observer
      );

      let cappedRebalanceAmount = wasmDecimalToNative(rebalanceAmountDecimal).muln(95).divn(100);

      debug("Trying to rebalance deposit UTP:%s amount %s (RBDA)", utp_index, cappedRebalanceAmount);

      try {
        let sig = await this.utpFromIndex(utp_index).deposit(cappedRebalanceAmount);
        debug("Rebalance success (RBDS) sig %s", sig);
      } catch (e) {
        debug("Rebalance failed (RBDF)");
        debug(e);
      }

      [marginfiGroupAi, marginfiAccountAi] = await this._program.provider.connection.getMultipleAccountsInfo([
        this._config.groupPk,
        this.publicKey,
      ]);
    }
  }

  async checkBankruptcy() {
    const debug = require("debug")(`mfi:margin-account:${this.publicKey.toString()}:bankruptcy`);
    debug("Checking bankruptcy");

    let [marginfiGroupAi, marginfiAccountAi] = await this.loadAccountAndGroupAi();

    if (!marginfiAccountAi) {
      throw Error("Marginfi account no found");
    }
    if (!marginfiGroupAi) {
      throw Error("Marginfi Group Account no found");
    }

    const observations = await this.observe();
    let observer = await this.getObserver(observations);
    const isBankrupt = is_bankrupt(marginfiAccountAi.data, marginfiGroupAi.data, observer);

    if (!isBankrupt) {
      return;
    }
    debug("Handle bankruptcy required");

    try {
      const sig = await this.handleBankruptcy();
      debug("Handle bankruptcy success - sig %s (HBS)", sig);
    } catch (e) {
      debug("Handle bankruptcy failed (HBF)");
      console.error(e);
    }
  }

  private async loadAccountAndGroupAi(): Promise<AccountInfo<Buffer>[]> {
    const debug = require("debug")(`mfi:margin-account:${this.publicKey.toString()}:loader`);
    debug("Loading marginfi account %s, and group %s", this.publicKey, this._config.groupPk);

    let [marginfiGroupAi, marginfiAccountAi] = await this._program.provider.connection.getMultipleAccountsInfo([
      this._config.groupPk,
      this.publicKey,
    ]);

    if (!marginfiAccountAi) {
      throw Error("Marginfi account no found");
    }
    if (!marginfiGroupAi) {
      throw Error("Marginfi Group Account no found");
    }

    return [marginfiGroupAi, marginfiAccountAi];
  }

  public async canBeLiquidated() {
    try {
      let [marginfiGroupAi, marginfiAccountAi] = await this.loadAccountAndGroupAi();
      const observer = await this.getObserver();

      return liquidation_valid(marginfiAccountAi.data, marginfiGroupAi.data, observer);
    } catch (e) {
      return false;
    }
  }

  public async liquidate(marginfiAccountLiquidatee: MarginfiAccount, utpIndex: number): Promise<string> {
    const debug = require("debug")(`mfi:margin-account:${this.publicKey.toString()}:liquidate`);
    let [bankAuthority, _] = await getBankAuthority(this._config.groupPk, this._program.programId);

    const remainingAccounts = await marginfiAccountLiquidatee.getObservationAccounts();

    let liquidateIx = await makeLiquidateIx(
      this._program,
      {
        marginfiAccountPk: this.publicKey,
        marginfiAccountLiquidateePk: marginfiAccountLiquidatee.publicKey,
        marginfiGroupPk: this.group.publicKey,
        signerPk: this._authority,
        bankVault: this.group.bank.vault,
        bankAuthority,
        bankInsuranceVault: this.group.bank.insuranceVault,
      },
      { utpIndex: new BN(utpIndex) },
      remainingAccounts
    );

    debug("Liquidator %s, liquidating %s UTP %s", this.publicKey, marginfiAccountLiquidatee.publicKey, utpIndex);

    const tx = new Transaction().add(liquidateIx);
    const sig = await processTransaction(this._program.provider, tx);
    debug("Successfully liquidated %s", sig);
    await this.reload();
    return sig;
  }

  public async getDeposits(): Promise<BN> {
    let [marginfiGroupAi, marginfiAccountAi] = await this.loadAccountAndGroupAi();
    let balance = get_quote_balance(marginfiAccountAi.data, marginfiGroupAi.data, true).valueOf();

    return bigIntToBN(balance);
  }

  public async getBalance(): Promise<[BN, BN, BN]> {
    let [marginfiGroupAi, marginfiAccountAi] = await this.loadAccountAndGroupAi();

    let assets = new BN(0);

    let deposits = bigIntToBN(get_quote_balance(marginfiAccountAi.data, marginfiGroupAi.data, true).valueOf());

    assets = assets.add(deposits);

    let indexed_observations = await this.observe();
    for (let observation of indexed_observations) {
      if (!this.isUtpActive(observation.utp_index)) {
        continue;
      }
      assets = assets.add(observation.observation.freeCollateral);
    }

    let liabilities = bigIntToBN(get_quote_balance(marginfiAccountAi.data, marginfiGroupAi.data, false).valueOf());

    let balance = assets.sub(liabilities);

    return [balance, assets, liabilities];
  }

  public isUtpActive(index: number): boolean {
    return this.allUtps()[index].isActive;
  }

  public async getMarginRequirement(type: MarginRequirementType): Promise<Decimal> {
    let [marginfiGroupAi, marginfiAccountAi] = await this.loadAccountAndGroupAi();
    let mreq = get_margin_requirement(marginfiAccountAi.data, marginfiGroupAi.data, type);

    return Decimal.fromWasm(mreq);
  }
}

export type MarginRequirementType = WasmMarginRequirement;

function bigIntToBN(number: bigint, size: number = 8): BN {
  return new BN(toBufferBE(number, size), undefined, "be");
}
