import {
  get_max_rebalance_deposit_amount,
  get_max_rebalance_withdraw_amount,
  rebalance_deposit_valid,
  rebalance_withdraw_valid,
} from '@mrgnlabs/utp-utils';
import { BN, BorshCoder, Program } from '@project-serum/anchor';
import { associatedAddress } from '@project-serum/anchor/dist/cjs/utils/token';
import {
  PublicKey,
  Transaction,
  TransactionInstruction,
} from '@solana/web3.js';
import { MarginfiConfig } from './config';
import { MarginfiIdl, MARGINFI_IDL } from './idl';
import {
  makeDeactivateUtpIx,
  makeDepositIx,
  makeVerifyMarginRequirementsIx,
  makeWithdrawIx,
} from './instruction';
import { MarginfiGroup } from './marginfiGroup';
import { UtpCache } from './state';
import {
  AccountType,
  InstructionLayout,
  MarginAccountData,
  UtpAccount,
  UtpData,
} from './types';
import {
  Decimal,
  getBankAuthority,
  mDecimalToNative,
  processTransaction,
  wasmDecimalToNative,
} from './utils';
import { DriftAccount } from './utp/drift';
import { MangoAccount } from './utp/mango';

/**
 * Wrapper class around a specific marginfi margin account.
 */
export class MarginAccount {
  public readonly publicKey: PublicKey;
  private _program: Program<MarginfiIdl>;
  private _config: MarginfiConfig;

  private _authority: PublicKey;
  private _group: MarginfiGroup;
  private _depositRecord: BN;
  private _borrowRecord: BN;

  public readonly driftUtp: DriftAccount;
  public readonly mangoUtp: MangoAccount;

  allUtps(): UtpAccount[] {
    return [this.driftUtp, this.mangoUtp]; // *Must* be sorted according to UTP indices
  }

  activeUtps(): UtpAccount[] {
    return this.allUtps().filter((utp) => utp.isActive);
  }

  /**
   * @internal
   */
  private constructor(
    marginAccountPk: PublicKey,
    config: MarginfiConfig,
    program: Program<MarginfiIdl>,
    authority: PublicKey,
    group: MarginfiGroup,
    depositRecord: BN,
    borrowRecord: BN,
    driftUtpData: UtpData,
    mangoUtpData: UtpData
  ) {
    this.publicKey = marginAccountPk;
    this._config = config;
    this._program = program;

    this.driftUtp = new DriftAccount(config, program, this, driftUtpData);
    this.mangoUtp = new MangoAccount(config, program, this, mangoUtpData);

    this._authority = authority;
    this._group = group;
    this._depositRecord = depositRecord;
    this._borrowRecord = borrowRecord;
  }

  // --- Factories

  /**
   * MarginAccount network factory
   *
   * Fetch account data according to the config and instantiate the corresponding MarginAccount.
   *
   * @param marginAccountPk Address of the target account
   * @param config marginfi config
   * @param program marginfi Anchor program
   * @returns MarginAccount instance
   */
  static async get(
    marginAccountPk: PublicKey,
    config: MarginfiConfig,
    program: Program<MarginfiIdl>
  ) {
    const accountData = await MarginAccount._fetchAccountData(
      marginAccountPk,
      config,
      program
    );
    const marginAccount = new MarginAccount(
      marginAccountPk,
      config,
      program,
      accountData.authority,
      await MarginfiGroup.get(config, program),
      mDecimalToNative(accountData.depositRecord),
      mDecimalToNative(accountData.borrowRecord),
      MarginAccount._packUtpData(accountData, config.drift.utpIndex),
      MarginAccount._packUtpData(accountData, config.mango.utpIndex)
    );
    return marginAccount;
  }

  /**
   * MarginAccount local factory (decoded)
   *
   * Instantiate a MarginAccount according to the provided decoded data.
   * Check sanity against provided config.
   *
   * @param marginAccountPk Address of the target account
   * @param config marginfi config
   * @param program marginfi Anchor program
   * @param accountData Decoded marginfi margin account data
   * @param marginfiGroup MarginfiGroup instance
   * @returns MarginAccount instance
   */
  static fromAccountData(
    marginAccountPk: PublicKey,
    config: MarginfiConfig,
    program: Program<MarginfiIdl>,
    accountData: MarginAccountData,
    marginfiGroup: MarginfiGroup
  ) {
    if (!accountData.marginGroup.equals(config.groupPk))
      throw Error(
        `Marginfi account tied to group ${accountData.marginGroup.toBase58()}. Expected: ${config.groupPk.toBase58()}`
      );

    return new MarginAccount(
      marginAccountPk,
      config,
      program,
      accountData.authority,
      marginfiGroup,
      mDecimalToNative(accountData.depositRecord),
      mDecimalToNative(accountData.borrowRecord),
      MarginAccount._packUtpData(accountData, config.drift.utpIndex),
      MarginAccount._packUtpData(accountData, config.mango.utpIndex)
    );
  }

  /**
   * MarginAccount local factory (encoded)
   *
   * Instantiate a MarginAccount according to the provided encoded data.
   * Check sanity against provided config.
   *
   * @param marginAccountPk Address of the target account
   * @param config marginfi config
   * @param program marginfi Anchor program
   * @param marginAccountRawData Encoded marginfi margin account data
   * @param marginfiGroup MarginfiGroup instance
   * @returns MarginAccount instance
   */
  static fromAccountDataRaw(
    marginAccountPk: PublicKey,
    config: MarginfiConfig,
    program: Program<MarginfiIdl>,
    marginAccountRawData: Buffer,
    marginfiGroup: MarginfiGroup
  ) {
    const marginAccountData = MarginAccount.decode(marginAccountRawData);

    return MarginAccount.fromAccountData(
      marginAccountPk,
      config,
      program,
      marginAccountData,
      marginfiGroup
    );
  }

  // --- Getters and setters

  /**
   * Margin account authority address
   */
  get authority(): PublicKey {
    return this._authority;
  }

  /**
   * Margin account group address
   */
  get group(): MarginfiGroup {
    return this._group;
  }

  /**
   * Margin account deposit
   */
  get depositRecord(): BN {
    return this._depositRecord;
  }

  /**
   * Margin account debt
   */
  get borrowRecord(): BN {
    return this._borrowRecord;
  }

  // --- Others

  /**
   * Fetch margin account data.
   * Check sanity against provided config.
   *
   * @param config marginfi config
   * @param program marginfi Anchor program
   * @returns Decoded margin account data struct
   */
  private static async _fetchAccountData(
    accountAddress: PublicKey,
    config: MarginfiConfig,
    program: Program<MarginfiIdl>
  ): Promise<MarginAccountData> {
    const data: MarginAccountData = (await program.account.marginAccount.fetch(
      accountAddress
    )) as any;

    if (!data.marginGroup.equals(config.groupPk))
      throw Error(
        `Marginfi account tied to group ${data.marginGroup.toBase58()}. Expected: ${config.groupPk.toBase58()}`
      );

    return data;
  }

  /**
   * Pack data from the on-chain, vector format into a coherent unit.
   *
   * @param data Margin account data
   * @param utpIndex Index of the target UTP
   * @returns UTP data struct
   */
  private static _packUtpData(
    data: MarginAccountData,
    utpIndex: number
  ): UtpData {
    return {
      accountConfig: data.utpAccountConfig[utpIndex],
      accountCache: data.utpCache[utpIndex],
      isActive: data.activeUtps[utpIndex],
    };
  }

  /**
   * Decode margin account data according to the Anchor IDL.
   *
   * @param encoded Raw data buffer
   * @returns Decoded margin account data struct
   */
  static decode(encoded: Buffer): MarginAccountData {
    const coder = new BorshCoder(MARGINFI_IDL);
    return coder.accounts.decode(AccountType.MarginAccount, encoded);
  }

  /**
   * Decode margin account data according to the Anchor IDL.
   *
   * @param decoded Margin account data struct
   * @returns Raw data buffer
   */
  static async encode(decoded: MarginAccountData): Promise<Buffer> {
    const coder = new BorshCoder(MARGINFI_IDL);
    return await coder.accounts.encode(AccountType.MarginAccount, decoded);
  }

  /**
   * Update instance data by fetching and storing the latest on-chain state.
   */
  async fetch() {
    const data = await MarginAccount._fetchAccountData(
      this.publicKey,
      this._config,
      this._program
    );
    this._group = await MarginfiGroup.get(this._config, this._program);
    this._updateFromAccountData(data);
  }

  /**
   * Update instance data from provided data struct.
   *
   * @param data Margin account data struct
   */
  private _updateFromAccountData(data: MarginAccountData) {
    this._authority = data.authority;
    this._depositRecord = mDecimalToNative(data.depositRecord);
    this._borrowRecord = mDecimalToNative(data.borrowRecord);

    this.driftUtp.update(
      MarginAccount._packUtpData(data, this._config.drift.utpIndex)
    );
    this.mangoUtp.update(
      MarginAccount._packUtpData(data, this._config.mango.utpIndex)
    );
  }

  /**
   * Create transaction instruction to deposit collateral into the margin account.
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
        marginAccountPk: this.publicKey,
        authorityPk: this._program.provider.wallet.publicKey,
        userTokenAtaPk,
        bankVaultPk: this._group.bank.vault,
      },
      { amount }
    );
  }

  /**
   * Deposit collateral into the margin account.
   *
   * @param amount Amount to deposit (mint native unit)
   * @returns Transaction signature
   */
  async deposit(amount: BN): Promise<string> {
    const depositIx = await this.makeDepositIx(amount);
    const tx = new Transaction().add(depositIx);
    const sig = await processTransaction(this._program.provider, tx);
    await this.fetch();
    return sig;
  }

  /**
   * Create transaction instruction to withdraw collateral from the margin account.
   *
   * @param amount Amount to withdraw (mint native unit)
   * @returns `MarginWithdrawCollateral` transaction instruction
   */
  async makeWithdrawIx(amount: BN) {
    const userTokenAtaPk = await associatedAddress({
      mint: this._group.bank.mint,
      owner: this._program.provider.wallet.publicKey,
    });
    const [marginBankAuthorityPk] = await getBankAuthority(
      this._config.groupPk,
      this._program.programId
    );

    return makeWithdrawIx(
      this._program,
      {
        marginfiGroupPk: this._group.publicKey,
        marginAccountPk: this.publicKey,
        authorityPk: this._program.provider.wallet.publicKey,
        receivingTokenAccount: userTokenAtaPk,
        bankVaultPk: this._group.bank.vault,
        bankVaultAuthorityPk: marginBankAuthorityPk,
      },
      { amount }
    );
  }

  /**
   * Withdraw collateral from the margin account.
   *
   * @param amount Amount to withdraw (mint native unit)
   * @returns Transaction signature
   */
  async withdraw(amount: BN): Promise<string> {
    const withdrawIx = await this.makeWithdrawIx(amount);
    const tx = new Transaction().add(withdrawIx);
    const sig = await processTransaction(this._program.provider, tx);
    await this.fetch();
    return sig;
  }

  /**
   * Create transaction instruction to verify the margin requirements of the margin account.
   *
   * @returns `VerifyMarginRequirements` transaction instruction
   */
  async makeVerifyMarginRequirementsIx() {
    return makeVerifyMarginRequirementsIx(this._program, {
      marginfiGroupPk: this._group.publicKey,
      marginAccountPk: this.publicKey,
      authorityPk: this._program.provider.wallet.publicKey,
    });
  }

  /**
   * Verify the margin requirements of the margin account.
   *
   * @returns Transaction signature
   */
  async verifyMarginRequirements() {
    const verifyIx = await this.makeVerifyMarginRequirementsIx();
    const tx = new Transaction().add(verifyIx);
    return processTransaction(this._program.provider, tx);
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
    return makeDeactivateUtpIx(
      this._program,
      {
        marginAccountPk: this.publicKey,
        authorityPk: this._program.provider.wallet.publicKey,
      },
      { utpIndex }
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
    const ixs = await this.createChainedIxs(
      verifyIx,
      InstructionLayout.ObserveBefore
    );
    const tx = new Transaction().add(...ixs);
    return processTransaction(this._program.provider, tx);
  }

  /**
   * Create ordered transaction instruction list to sequentialy observe all active UTPs.
   *
   * @returns List of `Observe` transaction instructions
   */
  async createObservationIxs(): Promise<TransactionInstruction[]> {
    return Promise.all(
      this.activeUtps().map(async (utp) => await utp.makeObserveIx())
    );
  }

  /**
   * Create transaction instruction to observe and cache the health of the target UTP.
   *
   * @param utpIndex Target UTP index
   * @returns `Observe` transaction instruction
   */
  async createObservationIx(utpIndex: number): Promise<TransactionInstruction> {
    return this.utpFromIndex(utpIndex).makeObserveIx();
  }

  /**
   * Create transaction instruction list according to the specified layout.
   * Required to perform actions impacting the health of the account.
   *
   * @param ix Main instruction
   * @param layout Desired layout
   * @param utpIndex UTP to observe prior to the main instruction when `layout == HalfSandwichObserveCheck` (discarded otherwise)
   * @returns List of transaction instructions according to the requested layout
   */
  async createChainedIxs(
    ix: TransactionInstruction,
    layout: InstructionLayout,
    utpIndex?: number
  ): Promise<TransactionInstruction[]> {
    switch (layout) {
      case InstructionLayout.ObserveBefore:
        return [...(await this.createObservationIxs()), ix];
      case InstructionLayout.ObserveAndCheckAfter:
        return [
          ix,
          ...(await this.createObservationIxs()),
          await this.makeVerifyMarginRequirementsIx(),
        ];
      case InstructionLayout.HalfSandwichObserveCheck:
        if (!utpIndex) {
          throw Error(
            'The `HalfSandwichObserveCheck` requires a UTP index to be specified'
          );
        }
        return [
          await this.createObservationIx(utpIndex),
          ix,
          ...(await this.createObservationIxs()),
          await this.makeVerifyMarginRequirementsIx(),
        ];
      default:
        throw Error('You were never meant to be here!!');
    }
  }

  /**
   * Refresh and retrieve the health cache for all active UTPs directly from the UTPs.
   *
   * @returns List of health caches for all active UTPs
   */
  async localObserve(): Promise<{ index: number; cache: UtpCache }[]> {
    return Promise.all(
      this.activeUtps().map(async (utp) => ({
        index: utp.index,
        cache: await utp.localObserve(),
      }))
    );
  }

  /**
   * Retrieve the UTP interface instance from its index
   *
   * @param utpIndex UTP index
   * @returns UTP interface instance
   */
  private utpFromIndex(utpIndex: number): UtpAccount {
    switch (utpIndex) {
      case 0:
        return this.driftUtp;
      case 1:
        return this.mangoUtp;

      default:
        throw Error('Unsupported UTP');
    }
  }

  async checkRebalance() {
    await this.checkRebalanceDeposit();
    await this.checkRebalanceWithdraw();
  }

  private async checkRebalanceWithdraw() {
    console.log("%s - Checking withdraw rebalance for %s", new Date(), this.publicKey)
    let [marginGroupAi, marginAccountAi] =
      await this._program.provider.connection.getMultipleAccountsInfo([
        this._config.groupPk,
        this.publicKey,
      ]);

    if (!marginAccountAi) {
      throw Error("Margin Account no found")
    }
    if (!marginGroupAi) {
      throw Error("Margin Group Account no found")
    }

    const rebalanceNeeded = rebalance_withdraw_valid(marginAccountAi.data, marginGroupAi.data);

    if (!rebalanceNeeded) {
      return
    }

    console.log("Rebalance withdraw required for %s", this.publicKey);

    const observations = await this.localObserve();
    const richestUtpObservation = observations.reduce((a, b) => a.cache.freeCollateral < b.cache.freeCollateral ? a : b)
    const withdrawAmountDecimal = Decimal.fromWasm(get_max_rebalance_withdraw_amount(richestUtpObservation.cache.toWasm(), marginAccountAi.data, marginGroupAi.data));

    console.log("%s - REBALANCE_WITHDRAW:ATTEMPT UTP:%s, amount %s", richestUtpObservation.index, withdrawAmountDecimal);

    try {
      const sig = await this.utpFromIndex(richestUtpObservation.index).withdraw(withdrawAmountDecimal.toBN())
      console.log("%s - REBALANCE_WITHDRAW:ATTEMPT UTP:%s sig %s", new Date(), sig);
    } catch (e) {
      console.error("%s - REBALANCE_ERROR:ERROR sig %s", new Date());
      console.error(e); 
    }
  }

  private async checkRebalanceDeposit() {
    console.log('===================')
    console.log("%s - Checking deposit rebalance for %s", new Date(), this.publicKey)
    let [marginGroupAi, marginAccountAi] =
      await this._program.provider.connection.getMultipleAccountsInfo([
        this._config.groupPk,
        this.publicKey,
      ]);

    if (!marginAccountAi) {
      throw Error("Margin Account no found")
    }
    if (!marginGroupAi) {
      throw Error("Margin Group Account no found")
    }

    let observations = await this.localObserve();
    console.log('Loaded %s', observations.length)
    for (let observation of observations) {
      let { index, cache } = observation;
      console.log('Checking UTP %s', index)
      console.log(cache.toString())

      if (!cache.valid) {
        continue;
      }

      const rebalanceRequired = rebalance_deposit_valid(cache.toWasm());

      if (!rebalanceRequired) {
        continue;
      }

      console.log("Observation for UTP %s", index)
      console.log(cache.toString())

      let rebalanceAmountDecimal = get_max_rebalance_deposit_amount(
        cache.toWasm(),
        marginAccountAi!.data,
        marginGroupAi!.data
      );

      let cappedRebalanceAmount = wasmDecimalToNative(rebalanceAmountDecimal)
        .muln(95)
        .divn(100);

      console.log("%s - REBALANCE_DEPOSIT:ATTEMPT UTP:%s, amount %s", index, cappedRebalanceAmount);

      try {
        let sig = await this.utpFromIndex(index).depositCrank(cappedRebalanceAmount);
        console.log("%s - REBALANCE_DEPOSIT:SUCCESS sig %s", new Date(), sig);
      } catch (e) {
        console.error("%s - REBALANCE_DEPOSIT:ERROR sig %s", new Date());
        console.error(e); 
      }

      [marginGroupAi, marginAccountAi] =
        await this._program.provider.connection.getMultipleAccountsInfo([
          this._config.groupPk,
          this.publicKey,
        ]);
    }
  }
}
