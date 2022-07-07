import { BN, BorshCoder, Program } from "@project-serum/anchor";
import { associatedAddress } from "@project-serum/anchor/dist/cjs/utils/token";
import { AccountInfo, AccountMeta, PublicKey, Transaction, TransactionInstruction } from "@solana/web3.js";
import BigNumber from "bignumber.js";
import { MarginfiClient } from ".";
import { LendingSide } from "./bank";
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
import {
  AccountBalances,
  AccountType,
  InstructionsWrapper,
  MarginfiAccountData,
  MarginRequirementType,
  ObservationCache,
  UtpData,
  UtpIndex,
} from "./types";
import { BankVaultType, decimalDataToBigNumber, getBankAuthority, processTransaction, uiToNative } from "./utils";
import { UtpMangoAccount } from "./utp/mango";
import { UtpZoAccount } from "./utp/zo";
import { UtpAccount } from "./utpAccount";
import { UtpObservation } from "./utpObservation";

/**
 * Wrapper class around a specific marginfi marginfi account.
 */
export class MarginfiAccount {
  public readonly publicKey: PublicKey;
  public group: MarginfiGroup;
  public observationCache: ObservationCache = new Map<UtpIndex, UtpObservation>();

  private _authority: PublicKey;
  private _depositRecord: BigNumber;
  private _borrowRecord: BigNumber;

  public readonly mango: UtpMangoAccount;
  public readonly zo: UtpZoAccount;

  /**
   * @internal
   */
  private constructor(
    marginfiAccountPk: PublicKey,
    authority: PublicKey,
    readonly client: MarginfiClient,
    group: MarginfiGroup,
    depositRecord: BigNumber,
    borrowRecord: BigNumber,
    mangoUtpData: UtpData,
    zoUtpData: UtpData
  ) {
    this.publicKey = marginfiAccountPk;
    client = client;

    this.mango = new UtpMangoAccount(client, this, mangoUtpData);
    this.zo = new UtpZoAccount(client, this, zoUtpData);

    this._authority = authority;
    this.group = group;

    this._depositRecord = depositRecord;
    this._borrowRecord = borrowRecord;
  }

  // --- Getters / Setters

  /**
   * Marginfi account authority address
   */
  get authority(): PublicKey {
    return this._authority;
  }

  /** @internal */
  private get _program() {
    return this.client.program;
  }

  /** @internal */
  private get _config() {
    return this.client.config;
  }

  public get allUtps(): UtpAccount[] {
    return [this.mango, this.zo]; // *Must* be sorted according to UTP indices
  }

  public get activeUtps(): UtpAccount[] {
    return this.allUtps.filter((utp) => utp.isActive);
  }

  public get deposits(): BigNumber {
    return this.group.bank.computeNativeAmount(this._depositRecord, LendingSide.Deposit);
  }

  public get borrows(): BigNumber {
    return this.group.bank.computeNativeAmount(this._borrowRecord, LendingSide.Borrow);
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
      decimalDataToBigNumber(accountData.depositRecord),
      decimalDataToBigNumber(accountData.borrowRecord),
      MarginfiAccount._packUtpData(accountData, config.mango.utpIndex),
      MarginfiAccount._packUtpData(accountData, config.zo.utpIndex)
    );

    require("debug")("mfi:margin-account")("Loaded marginfi account %s", marginfiAccountPk);

    return marginfiAccount;
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
      decimalDataToBigNumber(accountData.depositRecord),
      decimalDataToBigNumber(accountData.borrowRecord),
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
  private static _packUtpData(data: MarginfiAccountData, utpIndex: UtpIndex): UtpData {
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
  async reload(observeUtps: boolean = false) {
    require("debug")(`mfi:margin-account:${this.publicKey.toString()}:loader`)("Reloading account data");
    const [marginfiGroupAi, marginfiAccountAi] = await this.loadGroupAndAccountAi();
    const marginfiAccountData = MarginfiAccount.decode(marginfiAccountAi.data);
    if (!marginfiAccountData.marginfiGroup.equals(this._config.groupPk))
      throw Error(
        `Marginfi account tied to group ${marginfiAccountData.marginfiGroup.toBase58()}. Expected: ${this._config.groupPk.toBase58()}`
      );
    this.group = MarginfiGroup.fromAccountDataRaw(this._config, this._program, marginfiGroupAi.data);
    this._updateFromAccountData(marginfiAccountData);

    if (observeUtps) await this.observeUtps();
  }

  /**
   * Update instance data from provided data struct.
   *
   * @param data Marginfi account data struct
   */
  private _updateFromAccountData(data: MarginfiAccountData) {
    this._authority = data.authority;
    this._depositRecord = decimalDataToBigNumber(data.depositRecord);
    this._borrowRecord = decimalDataToBigNumber(data.borrowRecord);

    this.mango.update(MarginfiAccount._packUtpData(data, this._config.mango.utpIndex));
    this.zo.update(MarginfiAccount._packUtpData(data, this._config.zo.utpIndex));
  }

  /**
   * Create transaction instruction to deposit collateral into the marginfi account.
   *
   * @param amount Amount to deposit (mint native unit)
   * @returns `MarginDepositCollateral` transaction instruction
   */
  async makeDepositIx(amount: BN): Promise<TransactionInstruction[]> {
    const userTokenAtaPk = await associatedAddress({
      mint: this.group.bank.mint,
      owner: this._program.provider.wallet.publicKey,
    });
    const remainingAccounts = await this.getObservationAccounts();
    return [
      await makeDepositIx(
        this._program,
        {
          marginfiGroupPk: this.group.publicKey,
          marginfiAccountPk: this.publicKey,
          authorityPk: this._program.provider.wallet.publicKey,
          userTokenAtaPk,
          bankVaultPk: this.group.bank.vault,
        },
        { amount },
        remainingAccounts
      ),
    ];
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
    const tx = new Transaction().add(...depositIx);
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
  async makeWithdrawIx(amount: BN): Promise<TransactionInstruction[]> {
    const userTokenAtaPk = await associatedAddress({
      mint: this.group.bank.mint,
      owner: this._program.provider.wallet.publicKey,
    });
    const [marginBankAuthorityPk] = await getBankAuthority(this._config.groupPk, this._program.programId);
    const remainingAccounts = await this.getObservationAccounts();
    return [
      await makeWithdrawIx(
        this._program,
        {
          marginfiGroupPk: this.group.publicKey,
          marginfiAccountPk: this.publicKey,
          authorityPk: this._program.provider.wallet.publicKey,
          receivingTokenAccount: userTokenAtaPk,
          bankVaultPk: this.group.bank.vault,
          bankVaultAuthorityPk: marginBankAuthorityPk,
        },
        { amount },
        remainingAccounts
      ),
    ];
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
    const tx = new Transaction().add(...withdrawIx);
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
  async makeDeactivateUtpIx(utpIndex: BN): Promise<InstructionsWrapper> {
    const remainingAccounts = await this.getObservationAccounts();

    return {
      instructions: [
        await makeDeactivateUtpIx(
          this._program,
          {
            marginfiAccountPk: this.publicKey,
            authorityPk: this._program.provider.wallet.publicKey,
          },
          { utpIndex },
          remainingAccounts
        ),
      ],
      keys: [],
    };
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
    const tx = new Transaction().add(...verifyIx.instructions);
    return processTransaction(this._program.provider, tx);
  }

  /**
   * Create transaction instruction to handle a bankrupt account.
   *
   * @returns `HandleBankruptcy` transaction instruction
   */
  async makeHandleBankruptcyIx(): Promise<InstructionsWrapper> {
    const remainingAccounts = await this.getObservationAccounts();
    const insuranceVaultAuthorityPk = (
      await getBankAuthority(this.group.publicKey, this._program.programId, BankVaultType.InsuranceVault)
    )[0];

    return {
      instructions: [
        await makeHandleBankruptcyIx(
          this._program,
          {
            marginfiAccountPk: this.publicKey,
            marginfiGroupPk: this.group.publicKey,
            insuranceVaultAuthorityPk,
            insuranceVaultPk: this.group.bank.insuranceVault,
            liquidityVaultPk: this.group.bank.vault,
          },
          remainingAccounts
        ),
      ],
      keys: [],
    };
  }

  /**
   * Handle a bankrupt account.
   *
   * @returns Transaction signature
   */
  async handleBankruptcy() {
    const handleBankruptcyIx = await this.makeHandleBankruptcyIx();
    const tx = new Transaction().add(...handleBankruptcyIx.instructions);
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
      await Promise.all(this.activeUtps.map(async (utp) => await utp.getObservationAccounts()))
    ).flatMap((a) => a);

    debug("Loading %s observation accounts", accounts.length);

    return accounts;
  }

  /**
   * Refresh and retrieve the health cache for all active UTPs directly from the UTPs.
   *
   * @returns List of health caches for all active UTPs
   */
  async observeUtps(): Promise<ObservationCache> {
    const debug = require("debug")(`mfi:margin-account:${this.publicKey.toString()}:observe`);
    debug("Observing UTP Accounts");
    const observations = await Promise.all(
      this.activeUtps.map(async (utp) => ({
        utpIndex: utp.index,
        observation: await utp.observe(),
      }))
    );
    const observationCache = observations.reduce((acc, o) => {
      acc.set(o.utpIndex, o.observation);
      return acc;
    }, new Map<number, UtpObservation>());
    this.observationCache = observationCache;
    return observationCache;
  }

  /**
   * Retrieve the UTP interface instance from its index
   *
   * @param utpIndex UTP index
   * @returns UTP interface instance
   */
  private utpFromIndex(utpIndex: UtpIndex): UtpAccount {
    if (utpIndex >= this.allUtps.length) {
      throw Error(`Unsupported UTP ${utpIndex} (${this.allUtps.length} UTPs supported)`);
    }
    return this.allUtps[utpIndex];
  }

  async checkRebalance() {
    require("debug")(`mfi:margin-account:${this.publicKey.toString()}:rebalance`)("Checking rebalance");
    await this.checkRebalanceDeposit();
    await this.checkRebalanceWithdraw();
  }

  private async checkRebalanceWithdraw() {
    const debug = require("debug")(`mfi:margin-account:${this.publicKey.toString()}:rebalance:withdraw`);
    debug("Checking withdraw rebalance");

    await this.reload(true);

    const rebalanceNeeded = await this.isRebalanceWithdrawNeeded();

    if (!rebalanceNeeded) {
      return;
    }

    debug("Rebalance withdraw required");

    const richestUtp = this.activeUtps.sort((utp1, utp2) =>
      utp2.freeCollateral.minus(utp1.freeCollateral).toNumber()
    )[0];
    const withdrawAmount = this.computeMaxRebalanceWithdrawAmount(richestUtp);

    debug("Trying to rebalance withdraw UTP:%s, amount %s (RBWA)", richestUtp.index, withdrawAmount);

    try {
      const sig = await this.utpFromIndex(richestUtp.index).withdraw(uiToNative(withdrawAmount));
      debug("Rebalance withdraw success - sig %s (RBWS)", sig);
    } catch (e) {
      debug("Rebalance withdraw failed (RBWF)");
      throw e;
    }
  }

  private async checkRebalanceDeposit() {
    let debug = require("debug")(`mfi:margin-account:${this.publicKey.toString()}:rebalance:deposit`);
    debug("Checking deposit rebalance");

    await this.reload(true);
    debug("Loaded %s observations", this.observationCache.size);
    for (let utp of this.activeUtps) {
      let debug = require("debug")(
        `mfi:margin-account:${this.publicKey.toString()}:rebalance:deposit:utp:${utp.index}`
      );
      debug(utp.cachedObservation.toString());

      if (!utp.isRebalanceDepositNeeded) {
        continue;
      }

      let rebalanceAmountDecimal = this.computeMaxRebalanceDepositAmount(utp);
      let cappedRebalanceAmount = uiToNative(rebalanceAmountDecimal.times(0.95));
      debug("Trying to rebalance deposit UTP:%s amount %s (RBDA)", utp.index, cappedRebalanceAmount);

      try {
        let sig = await this.utpFromIndex(utp.index).deposit(cappedRebalanceAmount);
        debug("Rebalance success (RBDS) sig %s", sig);
      } catch (e) {
        debug("Rebalance failed (RBDF)");
        throw e;
      }

      await this.reload();
    }
  }

  async checkBankruptcy() {
    const debug = require("debug")(`mfi:margin-account:${this.publicKey.toString()}:bankruptcy`);
    debug("Checking bankruptcy");
    await this.reload(true);
    const isBankrupt = this.isBankrupt();

    if (!isBankrupt) {
      return;
    }
    debug("Handle bankruptcy required");

    try {
      const sig = await this.handleBankruptcy();
      debug("Handle bankruptcy success - sig %s (HBS)", sig);
    } catch (e) {
      debug("Handle bankruptcy failed (HBF)");
      throw e;
    }
  }

  public async liquidate(marginfiAccountLiquidatee: MarginfiAccount, utpIndex: UtpIndex): Promise<string> {
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

  public computeBalances(): AccountBalances {
    let assets = new BigNumber(0);
    assets = assets.plus(this.deposits);
    for (let utp of this.activeUtps) {
      assets = assets.plus(utp.freeCollateral);
    }
    let liabilities = this.borrows;
    let equity = assets.minus(liabilities);

    return { equity, assets, liabilities };
  }

  public computeMarginRequirement(type: MarginRequirementType): BigNumber {
    const marginRatio = this.group.bank.marginRatio(type);
    const borrows = this.borrows;
    const marginRequirement = borrows.times(marginRatio);
    return marginRequirement;
  }

  public meetsMarginRequirement(type: MarginRequirementType): boolean {
    const { equity } = this.computeBalances();
    const marginRequirement = this.computeMarginRequirement(type);
    return equity > marginRequirement;
  }

  public isUtpActive(utpIndex: UtpIndex): boolean {
    return this.allUtps[utpIndex].isActive;
  }

  public canBeLiquidated() {
    return !this.meetsMarginRequirement(MarginRequirementType.Maint);
  }

  public isBankrupt(): boolean {
    return this.activeUtps.length === 0 && this._borrowRecord.gt(0);
  }

  public isRebalanceWithdrawNeeded(): boolean {
    const { equity } = this.computeBalances();
    const marginRequirementInit = this.computeMarginRequirement(MarginRequirementType.Init);
    return equity < marginRequirementInit;
  }

  public computeMaxRebalanceWithdrawAmount(utp: UtpAccount): BigNumber {
    const { equity } = this.computeBalances();
    const marginRequirementInit = this.computeMarginRequirement(MarginRequirementType.Init);
    const maxAmountAllowed = BigNumber.max(marginRequirementInit.minus(equity), 0);
    const availableAmount = utp.freeCollateral || 0;
    return BigNumber.min(maxAmountAllowed, availableAmount);
  }

  public computeMaxRebalanceDepositAmount(utp: UtpAccount): BigNumber {
    const { equity } = this.computeBalances();
    const marginRequirementInit = this.computeMarginRequirement(MarginRequirementType.Init);
    const accountFreeCollateral = BigNumber.max(0, equity.minus(marginRequirementInit));
    return BigNumber.min(utp.maxRebalanceDepositAmount, accountFreeCollateral);
  }

  private async loadGroupAndAccountAi(): Promise<AccountInfo<Buffer>[]> {
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
}
