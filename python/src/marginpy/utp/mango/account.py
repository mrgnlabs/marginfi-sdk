from marginpy import MarginfiClient, MarginfiAccount
from marginpy.utp.account import UtpAccount
from marginpy.types import UtpData


class UtpMangoAccount(UtpAccount):
    """[Internal] Class encapsulating Mango-specific interactions"""
    client: MarginfiClient
    marginfi_account: MarginfiAccount
    is_active: bool
    account_config: UtpData

    def __init__(
        self,
        client: MarginfiClient,
        marginfi_account: MarginfiAccount,
        account_data: UtpData
    ):
        """[Internal]"""
        #@todo confirm this
        self._client = client
        self._marginfi_account = marginfi_account
        self.is_active = account_data.is_active
        self.account_config = account_data.account_config

    # --- Getters / Setters

    @property
    def config(self):
        return self._config.mango

    # --- Others

    async def make_activate_ix():
        """
        Create transaction instruction to activate Mango.
        
        :returns: `ActivateUtp` transaction instruction
        """
        # async makeActivateIx(): Promise<InstructionsWrapper> {
        #     const authoritySeed = Keypair.generate();

        #     const [mangoAuthorityPk, mangAuthorityBump] = await this.authority(authoritySeed.publicKey);
        #     const [mangoAccountPk] = await getMangoAccountPda(
        #     this._config.mango.groupConfig.publicKey,
        #     mangoAuthorityPk,
        #     new BN(0),
        #     this._config.mango.programId
        #     );

        #     return {
        #     instructions: [
        #         await instructions.makeActivateIx(
        #         this._program,
        #         {
        #             marginfiGroupPk: this._config.groupPk,
        #             marginfiAccountPk: this._marginfiAccount.publicKey,
        #             mangoProgramId: this._config.mango.programId,
        #             mangoGroupPk: this._config.mango.groupConfig.publicKey,
        #             mangoAccountPk,
        #             mangoAuthorityPk,
        #             authorityPk: this._program.provider.wallet.publicKey,
        #         },
        #         {
        #             authoritySeed: authoritySeed.publicKey,
        #             authorityBump: mangAuthorityBump,
        #         }
        #         ),
        #     ],
        #     keys: [],
        #     };
        # }
        pass

    async def activate():
        """
        Activate Mango.
        
        :returns: Transaction signature
        """
        # async activate() {
        #     const debug = require("debug")(`mfi:margin-account:${this._marginfiAccount.publicKey}:utp:mango:activate`);
        #     debug("Activate Mango UTP");
        #     const activateIx = await this.makeActivateIx();

        #     const tx = new Transaction().add(...activateIx.instructions);
        #     const sig = await processTransaction(this._program.provider, tx);
        #     await this._marginfiAccount.reload(); // Required to update the internal UTP address
        #     debug("Sig %s", sig);
        #     return sig;
        # }
        pass

    async def make_deactivate_ix(self):
        """
        Create transaction instruction to deactivate Mango.
        
        :returns: `DeactivateUtp` transaction instruction
        """
        return self._marginfi_account.make_deactivate_utp_ix(self.index)

    async def deactivate(self):
        """
        Deactivate UTP.
        
        :returns: Transaction signature
        """
        # async deactivate() {
        #     const debug = require("debug")(`mfi:utp:${this.address}:mango:deactivate`);
        #     this.verifyActive();
        #     debug("Deactivating Mango UTP");
        #     const sig = await this._marginfiAccount.deactivateUtp(this.index);
        #     debug("Sig %s", sig);
        #     await this._marginfiAccount.reload(); // Required to update the internal UTP address
        #     return sig;
        # }
        pass

    async def make_deposit_ix(self):
        """
        Create transaction instruction to deposit collateral into the Mango account.
        
        :param amount Amount to deposit (mint native unit)
        :returns `MangoDepositCollateral` transaction instruction
        """
        # async makeDepositIx(amount: UiAmount): Promise<InstructionsWrapper> {
        #     const proxyTokenAccountKey = Keypair.generate();
        #     const [mangoAuthorityPk] = await this.authority();

        #     const [marginBankAuthorityPk] = await getBankAuthority(this._config.groupPk, this._program.programId);
        #     const mangoGroup = await this.getMangoGroup();

        #     const collateralMintIndex = mangoGroup.getTokenIndex(this._config.collateralMintPk);
        #     await mangoGroup.loadRootBanks(this._program.provider.connection);
        #     const rootBankPk = mangoGroup.tokens[collateralMintIndex].rootBank;
        #     const nodeBankPk = mangoGroup.rootBankAccounts[collateralMintIndex]!.nodeBankAccounts[0].publicKey;
        #     const vaultPk = mangoGroup.rootBankAccounts[collateralMintIndex]!.nodeBankAccounts[0].vault;
        #     const remainingAccounts = await this._marginfiAccount.getObservationAccounts();

        #     const createProxyTokenAccountIx = SystemProgram.createAccount({
        #     fromPubkey: this._program.provider.wallet.publicKey,
        #     lamports: await this._program.provider.connection.getMinimumBalanceForRentExemption(AccountLayout.span),
        #     newAccountPubkey: proxyTokenAccountKey.publicKey,
        #     programId: TOKEN_PROGRAM_ID,
        #     space: AccountLayout.span,
        #     });
        #     const initProxyTokenAccountIx = Token.createInitAccountInstruction(
        #     TOKEN_PROGRAM_ID,
        #     this._marginfiAccount.group.bank.mint,
        #     proxyTokenAccountKey.publicKey,
        #     mangoAuthorityPk
        #     );

        #     return {
        #     instructions: [
        #         createProxyTokenAccountIx,
        #         initProxyTokenAccountIx,
        #         await instructions.makeDepositIx(
        #         this._program,
        #         {
        #             marginfiGroupPk: this._config.groupPk,
        #             marginfiAccountPk: this._marginfiAccount.publicKey,
        #             signerPk: this._program.provider.wallet.publicKey,
        #             bankVaultPk: this._marginfiAccount.group.bank.vault,
        #             bankAuthorityPk: marginBankAuthorityPk,
        #             proxyTokenAccountPk: proxyTokenAccountKey.publicKey,
        #             mangoRootBankPk: rootBankPk,
        #             mangoNodeBankPk: nodeBankPk,
        #             mangoVaultPk: vaultPk,
        #             mangoGroupPk: mangoGroup.publicKey,
        #             mangoCachePk: mangoGroup.mangoCache,
        #             mangoAccountPk: this.address,
        #             mangoAuthorityPk,
        #             mangoProgramId: this._config.mango.programId,
        #         },
        #         { amount: uiToNative(amount) },
        #         remainingAccounts
        #         ),
        #     ],
        #     keys: [proxyTokenAccountKey],
        #     };
        # }
        pass

    async def deposit(self):
        """
        Deposit collateral into the Mango account.
        
        :param amount Amount to deposit (mint native unit)
        :returns" Transaction signature
        """
        # async deposit(amount: UiAmount) {
        #     const debug = require("debug")(`mfi:utp:${this.address}:mango:deposit`);
        #     this.verifyActive();

        #     debug("Deposit %s into Mango", amount);

        #     const depositIx = await this.makeDepositIx(amount);
        #     const tx = new Transaction().add(...depositIx.instructions);
        #     const sig = await processTransaction(this._program.provider, tx, [...depositIx.keys]);
        #     debug("Sig %s", sig);
        #     return sig;
        # }
        pass

    async def make_withdraw_ix(self):
        """
        Create transaction instruction to withdraw from the Mango account to the marginfi account.
        
        :param amount Amount to deposit (mint native unit)
        :returns: `MangoWithdrawCollateral` transaction instruction
        """
        # async makeWithdrawIx(amount: UiAmount): Promise<InstructionsWrapper> {
        #     const [mangoAuthorityPk] = await await this.authority();
        #     const mangoGroup = await this.getMangoGroup();
        #     const collateralMintIndex = mangoGroup.getTokenIndex(this._config.collateralMintPk);

        #     await mangoGroup.loadRootBanks(this._program.provider.connection);
        #     const rootBankPk = mangoGroup.tokens[collateralMintIndex].rootBank;
        #     const nodeBankPk = mangoGroup.rootBankAccounts[collateralMintIndex]!.nodeBankAccounts[0].publicKey;
        #     const vaultPk = mangoGroup.rootBankAccounts[collateralMintIndex]!.nodeBankAccounts[0].vault;

        #     return {
        #     instructions: [
        #         await instructions.makeWithdrawIx(
        #         this._program,
        #         {
        #             marginfiGroupPk: this._config.groupPk,
        #             marginfiAccountPk: this._marginfiAccount.publicKey,
        #             signerPk: this._program.provider.wallet.publicKey,
        #             bankVaultPk: this._marginfiAccount.group.bank.vault,
        #             mangoRootBankPk: rootBankPk,
        #             mangoNodeBankPk: nodeBankPk,
        #             mangoVaultPk: vaultPk,
        #             mangoVaultAuthorityPk: mangoGroup.signerKey,
        #             mangoGroupPk: mangoGroup.publicKey,
        #             mangoCachePk: mangoGroup.mangoCache,
        #             mangoAccountPk: this.address,
        #             mangoAuthorityPk,
        #             mangoProgramId: this._config.mango.programId,
        #         },
        #         { amount: uiToNative(amount) }
        #         ),
        #     ],
        #     keys: [],
        #     };
        # }
        pass

    async def withdraw(self):
        """
        Withdraw from the Mango account to the marginfi account.
        
        :param amount Amount to deposit (mint native unit)
        :returns: Transaction signature
        """
        # async withdraw(amount: UiAmount) {
        #     const debug = require("debug")(`mfi:utp:${this.address}:mango:withdraw`);
        #     debug("Withdrawing %s from Mango", amount);
        #     this.verifyActive();

        #     const depositIx = await this.makeWithdrawIx(amount);
        #     const tx = new Transaction().add(...depositIx.instructions);
        #     const sig = await processTransaction(this._program.provider, tx);
        #     debug("Sig %s", sig);
        #     return sig;
        # }
        pass

    async def get_observation_accounts(self):
        """
        Create list of account metas required to observe a Mango account.
        
        :returns: `AccountMeta[]` list of account metas
        """
        # async getObservationAccounts(): Promise<AccountMeta[]> {
        #     const mangoGroup = await this.getMangoGroup();
        #     return [
        #     { pubkey: this.address, isSigner: false, isWritable: false },
        #     {
        #         pubkey: mangoGroup.publicKey,
        #         isSigner: false,
        #         isWritable: false,
        #     },
        #     {
        #         pubkey: mangoGroup.mangoCache,
        #         isSigner: false,
        #         isWritable: false,
        #     },
        #     ];
        # }
        pass

    async def make_place_perp_order_ix(self):
        """
        Create transaction instruction to place a perp order.
        
        :returns: `MangoPlacePerpOrder` transaction instruction
        """
        # async makePlacePerpOrderIx(
        #     market: PerpMarket,
        #     side: MangoOrderSide,
        #     price: UiAmount,
        #     quantity: UiAmount,
        #     options?: UtpMangoPlacePerpOrderOptions
        # ): Promise<InstructionsWrapper> {
        #     let priceNb = toNumber(price);
        #     let quantityNb = toNumber(quantity);

        #     options = options ? options : {};
        #     let { maxQuoteQuantity, limit, orderType, clientOrderId, reduceOnly, expiryTimestamp, expiryType } = options;
        #     limit = limit || 20;
        #     maxQuoteQuantity = maxQuoteQuantity ? toNumber(maxQuoteQuantity) : undefined;
        #     clientOrderId = clientOrderId === undefined ? 0 : clientOrderId;
        #     orderType = orderType || MangoPerpOrderType.ImmediateOrCancel;
        #     expiryType = expiryType || ExpiryType.Absolute;

        #     const [nativePrice, nativeQuantity] = market.uiToNativePriceQuantity(priceNb, quantityNb);
        #     const maxQuoteQuantityLots = maxQuoteQuantity ? market.uiQuoteToLots(maxQuoteQuantity) : I64_MAX_BN;

        #     const [mangoAuthorityPk] = await this.authority();
        #     const remainingAccounts = await this._marginfiAccount.getObservationAccounts();

        #     const args: UtpMangoPlacePerpOrderArgs = {
        #     side,
        #     price: nativePrice,
        #     maxBaseQuantity: nativeQuantity,
        #     maxQuoteQuantity: maxQuoteQuantityLots,
        #     clientOrderId: new BN(clientOrderId),
        #     orderType,
        #     reduceOnly,
        #     expiryTimestamp: expiryTimestamp ? new BN(Math.floor(expiryTimestamp)) : ZERO_BN,
        #     limit: new BN(limit), // one byte; max 255
        #     expiryType,
        #     };

        #     const mangoGroup = await this.getMangoGroup();

        #     return {
        #     instructions: [
        #         await instructions.makePlacePerpOrderIx(
        #         this._program,
        #         {
        #             marginfiAccountPk: this._marginfiAccount.publicKey,
        #             marginfiGroupPk: this._marginfiAccount.group.publicKey,
        #             authorityPk: this._program.provider.wallet.publicKey,
        #             mangoAuthorityPk,
        #             mangoProgramId: this._config.mango.programId,
        #             mangoGroupPk: mangoGroup.publicKey,
        #             mangoAccountPk: this.address,
        #             mangoCachePk: mangoGroup.mangoCache,
        #             mangoPerpMarketPk: market.publicKey,
        #             mangoBidsPk: market.bids,
        #             mangoAsksPk: market.asks,
        #             mangoEventQueuePk: market.eventQueue,
        #         },
        #         { args },
        #         remainingAccounts
        #         ),
        #     ],
        #     keys: [],
        #     };
        # }
        pass

    async def place_perp_order(self):
        """
        Place a perp order.
        
        :returns: Transaction signature
        """
        # async placePerpOrder(
        #     perpMarket: PerpMarket,
        #     side: any,
        #     price: UiAmount,
        #     quantity: UiAmount,
        #     options?: UtpMangoPlacePerpOrderOptions
        # ) {
        #     const debug = require("debug")(`mfi:utp:${this.address}:mango:place-perp-order2`);
        #     debug("Placing a %s perp order for %s @ %s of %s, opt: %o", side, quantity, price, perpMarket.publicKey, options);
        #     this.verifyActive();

        #     const placePerpOrderIx = await this.makePlacePerpOrderIx(perpMarket, side, price, quantity, options);
        #     const tx = new Transaction();
        #     tx.add(...placePerpOrderIx.instructions);
        #     const sig = await processTransaction(this._program.provider, tx);
        #     debug("Signature %s", sig);
        #     return sig;
        # }
        pass

    async def make_cancel_perp_order_ix(self):
        """
        Create transaction instruction to cancel a perp order.
        
        :returns: `MangoCancelPerpOrder` transaction instruction
        """
        # async makeCancelPerpOrderIx(market: PerpMarket, orderId: BN, invalidIdOk: boolean) {
        #     const [mangoAuthorityPk] = await this.authority();
        #     const remainingAccounts = await this._marginfiAccount.getObservationAccounts();

        #     return {
        #     instructions: [
        #         await instructions.makeCancelPerpOrderIx(
        #         this._program,
        #         {
        #             marginfiAccountPk: this._marginfiAccount.publicKey,
        #             marginfiGroupPk: this._marginfiAccount.group.publicKey,
        #             authorityPk: this._program.provider.wallet.publicKey,
        #             mangoAuthorityPk,
        #             mangoProgramId: this._config.mango.programId,
        #             mangoGroupPk: this._config.mango.groupConfig.publicKey,
        #             mangoAccountPk: this.address,
        #             mangoPerpMarketPk: market.publicKey,
        #             mangoBidsPk: market.bids,
        #             mangoAsksPk: market.asks,
        #         },
        #         { orderId, invalidIdOk },
        #         remainingAccounts
        #         ),
        #     ],
        #     keys: [],
        #     };
        # }
        pass

    async def cancel_perp_order(self):
        """
        Cancel a perp order.
        
        :returns: Transaction signature
        """
        # async cancelPerpOrder(perpMarket: PerpMarket, orderId: BN, invalidIdOk: boolean) {
        #     const debug = require("debug")(`mfi:utp:${this.address}:mango:cancel-perp-order`);
        #     debug("Cancelling perp order %s", orderId);
        #     this.verifyActive();

        #     const cancelPerpOrderIx = await this.makeCancelPerpOrderIx(perpMarket, orderId, invalidIdOk);
        #     const tx = new Transaction();
        #     tx.add(...cancelPerpOrderIx.instructions);
        #     const sig = await processTransaction(this._program.provider, tx);
        #     debug("Signature %s", sig);
        #     return sig;
        # }
        pass

    def verify_active(self):
        """[Internal]"""
        # private verifyActive() {
        #     const debug = require("debug")(`mfi:utp:${this.address}:mango:verify-active`);
        #     if (!this.isActive) {
        #     debug("Utp isn't active");
        #     throw new Error("Utp isn't active");
        #     }
        # }
        pass

    async def compute_utp_account_address(self):
        """[Internal]"""
        # async computeUtpAccountAddress(accountNumber: BN = new BN(0)) {
        #     const [utpAuthorityPk] = await this.authority();
        #     const [utpAccountPk] = await getMangoAccountPda(
        #     this._config.mango.groupConfig.publicKey,
        #     utpAuthorityPk,
        #     accountNumber,
        #     this._config.mango.programId
        #     );
        #     return utpAccountPk;
        # }
        pass

    async def observe(self):
        """
        Refresh and retrieve the health cache for the Mango account, directly from the mango account.
        
        :returns: Health cache for the Mango UTP
        """
        pass

    def get_mango_client(self):
        # getMangoClient(): MangoClient {
        #     return new MangoClient(this._client.program.provider.connection, this._client.config.mango.programId);
        # }
        pass

    async def get_mango_account(self):
        # async getMangoAccount(mangoGroup?: MangoGroup): Promise<MangoAccount> {
        #     if (!mangoGroup) {
        #     mangoGroup = await this.getMangoGroup();
        #     }

        #     const mangoClient = this.getMangoClient();
        #     const mangoAccount = await mangoClient.getMangoAccount(this.address, mangoGroup.dexProgramId);

        #     return mangoAccount;
        # }

        # async getMangoGroup(): Promise<MangoGroup> {
        #     const mangoClient = this.getMangoClient();
        #     return mangoClient.getMangoGroup(this._config.mango.groupConfig.publicKey);
        # }
        # }
        pass

async def get_mango_account_pda():
    """[Internal] Compute the Mango account PDA tied to the specified user."""
    # export async function getMangoAccountPda(
    #     mangoGroupPk: PublicKey,
    #     authority: PublicKey,
    #     accountNumber: BN,
    #     programId: PublicKey
    #     ): Promise<[PublicKey, number]> {
    #     return PublicKey.findProgramAddress(
    #         [mangoGroupPk.toBytes(), authority.toBytes(), new BN(accountNumber).toBuffer("le", 8)],
    #         programId
    #     );
    # }
    pass
