from __future__ import annotations
from marginpy.utp.account import UtpAccount
from marginpy.types import InstructionsWrapper, UtpData
from solana.keypair import Keypair
from solana.transaction import (
    AccountMeta,
    Transaction,
    TransactionSignature,
)
from solana.system_program import create_account, CreateAccountParams
from solana.publickey import PublicKey
from typing import TYPE_CHECKING, Tuple
from marginpy.utp.zo.instruction import ActivateAccounts, ActivateArgs, make_activate_ix
from marginpy.utp.zo.utils import CONTROL_ACCOUNT_SIZE
from .utils.generated_client.accounts.state import State
from .utils.generated_client.accounts.margin import Margin

if TYPE_CHECKING:
    from marginpy import MarginfiClient, MarginfiAccount


class UtpZoAccount(UtpAccount):
    """[Internal] Class encapsulating Mango-specific interactions"""

    def __init__(
        self,
        client: MarginfiClient,
        marginfi_account: MarginfiAccount,
        account_data: UtpData,
    ):
        """[Internal]"""
        super().__init__(
            client,
            marginfi_account,
            account_data.is_active,
            account_data.account_config,
        )

    # --- Getters / Setters

    @property
    def config(self):
        return self._config.zo

    # --- Others

    async def make_activate_ix(self) -> InstructionsWrapper:
        """
        Create transaction instruction to activate Mango.

        :returns: `ActivateUtp` transaction instruction
        """

        zo_control_keypair = Keypair()
        control_account_rent = int(
            (
                await self._program.provider.connection.get_minimum_balance_for_rent_exemption(
                    CONTROL_ACCOUNT_SIZE
                )
            )["result"]
        )
        create_control_account_ix = create_account(
            CreateAccountParams(
                program_id=self.config.program_id,
                from_pubkey=self._program.provider.wallet.public_key,
                lamports=control_account_rent,
                new_account_pubkey=zo_control_keypair.public_key,
                space=CONTROL_ACCOUNT_SIZE,
            )
        )

        authority_seed = Keypair()
        utp_authority_pk, utp_authority_bump = await self.authority(
            authority_seed.public_key
        )

        margin_pk, margin_bump = self.get_zo_margin_address(utp_authority_pk)

        activate_ix = make_activate_ix(
            ActivateArgs(
                authority_seed=authority_seed.public_key,
                authority_bump=utp_authority_bump,
                zo_margin_nonce=margin_bump,
            ),
            ActivateAccounts(
                marginfi_account=self._marginfi_account.pubkey,
                marginfi_group=self._config.group_pk,
                authority=self._program.provider.wallet.public_key,
                utp_authority=utp_authority_pk,
                zo_program=self.config.program_id,
                zo_control=zo_control_keypair.public_key,
                zo_margin=margin_pk,
                zo_state=self.config.state_pk,
            ),
            self._client.program_id,
        )

        return InstructionsWrapper(
            instructions=[create_control_account_ix, activate_ix],
            signers=[zo_control_keypair],
        )

    async def activate(self) -> TransactionSignature:
        """
        Activate Mango.

        :returns: Transaction signature
        """

        activate_ixs_wrapped = await self.make_activate_ix()
        tx = Transaction().add(*activate_ixs_wrapped.instructions)
        sig = await self._client.program.provider.send(tx, activate_ixs_wrapped.signers)
        await self._marginfi_account.reload()
        return sig

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

        self.verify_active()
        sig = await self._marginfi_account.deactivate_utp(self.index)
        await self._marginfi_account.reload()
        return sig

    async def make_deposit_ix(self):
        """
        Create transaction instruction to deposit collateral into the Mango account.

        :param amount Amount to deposit (mint native unit)
        :returns Transaction instruction
        """
        # async makeDepositIx(amount: UiAmount): Promise<InstructionsWrapper> {
        #     const zoProgramId = this._config.zo.programId;

        #     const [utpAuthorityPk] = await this.authority();
        #     const [tempTokenAccountKey, createTokenAccountIx, initTokenAccountIx] = await createTempTransferAccountIxs(
        #     this._client.program.provider,
        #     this._client.group.bank.mint,
        #     utpAuthorityPk
        #     );

        #     const [bankAuthority] = await getBankAuthority(
        #     this._config.groupPk,
        #     this._program.programId,
        #     BankVaultType.LiquidityVault
        #     );

        #     const [zoStateSigner] = await ZoClient.State.getSigner(this.config.statePk, zoProgramId);
        #     const zoState = await ZoClient.State.load(
        #     await ZoClient.createProgram(this._program.provider, this.config.cluster),
        #     this.config.statePk
        #     );
        #     const [zoVaultPk] = await zoState.getVaultCollateralByMint(this._client.group.bank.mint);
        #     const remainingAccounts = await this._marginfiAccount.getObservationAccounts();

        #     return {
        #     instructions: [
        #         createTokenAccountIx,
        #         initTokenAccountIx,
        #         await instructions.makeDepositIx(
        #         this._program,
        #         {
        #             marginfiGroup: this._config.groupPk,
        #             marginfiAccount: this._marginfiAccount.publicKey,
        #             signer: this._program.provider.wallet.publicKey,
        #             marginCollateralVault: this._client.group.bank.vault,
        #             bankAuthority: bankAuthority,
        #             tempCollateralAccount: tempTokenAccountKey.publicKey,
        #             utpAuthority: utpAuthorityPk,
        #             zoProgram: zoProgramId,
        #             zoState: this.config.statePk,
        #             zoStateSigner: zoStateSigner,
        #             zoCache: zoState.cache.pubkey,
        #             zoMargin: this.address,
        #             zoVault: zoVaultPk,
        #         },
        #         { amount: uiToNative(amount) },
        #         remainingAccounts
        #         ),
        #     ],
        #     keys: [tempTokenAccountKey],
        #     };
        # }
        pass

    async def deposit(self):
        # async deposit(amount: UiAmount): Promise<string> {
        #     const debug = require("debug")(`mfi:margin-account:${this._marginfiAccount.publicKey}:utp:zo:deposit`);
        #     debug("Depositing %s into 01", amount);

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
        :returns: Transaction instruction
        """
        # async makeWithdrawIx(amount: UiAmount): Promise<TransactionInstruction> {
        #     const [utpAuthority] = await this.authority();
        #     const zoProgram = await ZoClient.createProgram(this._program.provider, this.config.cluster);
        #     const zoState = await ZoClient.State.load(zoProgram, this.config.statePk);
        #     const [zoVaultPk] = await zoState.getVaultCollateralByMint(this._client.group.bank.mint);
        #     const zoMargin = await ZoClient.Margin.load(zoProgram, zoState, undefined, utpAuthority);
        #     const remainingAccounts = await this._marginfiAccount.getObservationAccounts();

        #     return instructions.makeWithdrawIx(
        #     this._program,
        #     {
        #         marginfiAccount: this._marginfiAccount.publicKey,
        #         marginfiGroup: this._client.group.publicKey,
        #         signer: this._program.provider.wallet.publicKey,
        #         marginCollateralVault: this._client.group.bank.vault,
        #         utpAuthority: utpAuthority,
        #         zoMargin: this.address,
        #         zoProgram: this.config.programId,
        #         zoState: this.config.statePk,
        #         zoStateSigner: zoState.signer,
        #         zoCache: zoState.cache.pubkey,
        #         zoControl: zoMargin.control.pubkey,
        #         zoVault: zoVaultPk,
        #     },
        #     { amount: uiToNative(amount) },
        #     remainingAccounts
        #     );
        # }
        pass

    async def withdraw(self):
        """
        Withdraw from the Zo account to the marginfi account.

        :param amount Amount to deposit (mint native unit)
        :returns: Transaction signature
        """
        # async withdraw(amount: UiAmount): Promise<string> {
        #     const debug = require("debug")(`mfi:margin-account:${this._marginfiAccount.publicKey}:utp:zo:withdraw`);
        #     debug("Withdrawing %s from 01", amount);

        #     const withdrawIx = await this.makeWithdrawIx(amount);
        #     const tx = new Transaction().add(withdrawIx);
        #     const sig = await processTransaction(this._program.provider, tx);
        #     debug("Sig %s", sig);
        #     return sig;
        # }
        pass

    async def get_observation_accounts(self):
        """
        Create list of account metas required to observe a Zo account.

        :returns: `AccountMeta[]` list of account metas
        """

        # TODO: change to 1 fetch for both accounts + decoding
        state = await State.fetch(
            self._program.provider.connection,
            self.config.state_pk,
            self._program.provider.opts.preflight_commitment,
            self.config.program_id,
        )
        margin = await Margin.fetch(
            self._program.provider.connection,
            self.address,
            self._program.provider.opts.preflight_commitment,
            self.config.program_id,
        )
        return [
            AccountMeta(
                pubkey=self.address,
                is_signer=False,
                is_writable=False,
            ),
            AccountMeta(
                pubkey=margin.control,
                is_signer=False,
                is_writable=False,
            ),
            AccountMeta(
                pubkey=self.config.state_pk,
                is_signer=False,
                is_writable=False,
            ),
            AccountMeta(
                pubkey=state.cache,
                is_signer=False,
                is_writable=False,
            ),
        ]

    async def make_place_perp_order_ix(self):
        """
        Create transaction instruction to place a perp order.

        :returns: Transaction instruction
        """
        # async makePlacePerpOrderIx({
        #     symbol,
        #     orderType,
        #     isLong,
        #     price,
        #     size,
        #     limit,
        #     clientId,
        # }: Readonly<{
        #     symbol: string;
        #     orderType: OrderType;
        #     isLong: boolean;
        #     price: number;
        #     size: number;
        #     limit?: number;
        #     clientId?: BN;
        # }>): Promise<InstructionsWrapper> {
        #     const [utpAuthority] = await this.authority();

        #     const zoProgram = await ZoClient.createProgram(this._program.provider, this.config.cluster);
        #     const zoState = await ZoClient.State.load(zoProgram, this.config.statePk);

        #     const zoMargin = await ZoClient.Margin.load(zoProgram, zoState, zoState.cache, utpAuthority);

        #     const [openOrdersPk] = await zoMargin.getOpenOrdersKeyBySymbol(symbol, this.config.cluster);

        #     const market = await zoState.getMarketBySymbol(symbol);
        #     const limitPriceBn = market.priceNumberToLots(price);
        #     const maxBaseQtyBn = market.baseSizeNumberToLots(size);
        #     const takerFee =
        #     market.decoded.perpType.toNumber() === 1
        #         ? ZoClient.ZO_FUTURE_TAKER_FEE
        #         : market.decoded.perpType.toNumber() === 2
        #         ? ZoClient.ZO_OPTION_TAKER_FEE
        #         : ZoClient.ZO_SQUARE_TAKER_FEE;
        #     const feeMultiplier = isLong ? 1 + takerFee : 1 - takerFee;
        #     const maxQuoteQtyBn = new BN(
        #     Math.round(limitPriceBn.mul(maxBaseQtyBn).mul(market.decoded["quoteLotSize"]).toNumber() * feeMultiplier)
        #     );
        #     const remainingAccounts = await this._marginfiAccount.getObservationAccounts();

        #     const args: UtpZoPlacePerpOrderArgs = {
        #     isLong,
        #     limitPrice: limitPriceBn,
        #     maxBaseQuantity: maxBaseQtyBn,
        #     maxQuoteQuantity: maxQuoteQtyBn,
        #     orderType,
        #     limit: limit ?? 10,
        #     clientId: clientId ?? new BN(0),
        #     };

        #     return {
        #     instructions: [
        #         await instructions.makePlacePerpOrderIx(
        #         this._client.program,
        #         {
        #             marginfiAccount: this._marginfiAccount.publicKey,
        #             marginfiGroup: this._client.group.publicKey,
        #             utpAuthority: utpAuthority,
        #             signer: this._program.provider.wallet.publicKey,
        #             zoProgram: zoProgram.programId,
        #             state: zoState.pubkey,
        #             stateSigner: zoState.signer,
        #             cache: zoState.cache.pubkey,
        #             margin: zoMargin.pubkey,
        #             control: zoMargin.control.pubkey,
        #             openOrders: openOrdersPk,
        #             dexMarket: market.publicKey,
        #             reqQ: market.requestQueueAddress,
        #             eventQ: market.eventQueueAddress,
        #             marketBids: market.bidsAddress,
        #             marketAsks: market.asksAddress,
        #             dexProgram: this.config.dexProgram,
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
        #     args: Readonly<{
        #     symbol: string;
        #     orderType: OrderType;
        #     isLong: boolean;
        #     price: number;
        #     size: number;
        #     limit?: number;
        #     clientId?: BN;
        #     }>
        # ): Promise<string> {
        #     const debug = require("debug")(`mfi:margin-account:${this._marginfiAccount.publicKey}:utp:zo:place-perp-order`);
        #     debug("Placing perp order on 01");
        #     debug("%s", args);

        #     const requestCUIx = ComputeBudgetProgram.requestUnits({
        #     units: 400000,
        #     additionalFee: 0,
        #     });
        #     const placeOrderIx = await this.makePlacePerpOrderIx(args);
        #     const tx = new Transaction().add(requestCUIx, ...placeOrderIx.instructions);
        #     const sig = await processTransaction(this._program.provider, tx);
        #     debug("Sig %s", sig);
        #     return sig;
        # }
        pass

    async def make_cancel_perp_order_ix(self):
        """
        Create transaction instruction to cancel a perp order.

        :returns: Transaction instruction
        """
        # async makeCancelPerpOrderIx(args: {
        #     symbol: string;
        #     isLong?: boolean;
        #     orderId?: BN;
        #     clientId?: BN;
        # }): Promise<InstructionsWrapper> {
        #     const [utpAuthority] = await this.authority();

        #     const zoProgram = await ZoClient.createProgram(this._program.provider, this.config.cluster);
        #     const zoState = await ZoClient.State.load(zoProgram, this.config.statePk);
        #     const zoMargin = await ZoClient.Margin.load(zoProgram, zoState, undefined, utpAuthority);
        #     const [openOrdersPk] = await zoMargin.getOpenOrdersKeyBySymbol(args.symbol, this.config.cluster);
        #     const market = await zoState.getMarketBySymbol(args.symbol);

        #     return {
        #     instructions: [
        #         await instructions.makeCancelPerpOrderIx(
        #         this._client.program,
        #         {
        #             marginfiAccount: this._marginfiAccount.publicKey,
        #             marginfiGroup: this._client.group.publicKey,
        #             utpAuthority: utpAuthority,
        #             signer: this._program.provider.wallet.publicKey,
        #             zoProgram: zoProgram.programId,
        #             state: zoState.pubkey,
        #             cache: zoState.cache.pubkey,
        #             margin: zoMargin.pubkey,
        #             control: zoMargin.control.pubkey,
        #             openOrders: openOrdersPk,
        #             dexMarket: market.publicKey,
        #             eventQ: market.eventQueueAddress,
        #             marketBids: market.bidsAddress,
        #             marketAsks: market.asksAddress,
        #             dexProgram: this.config.dexProgram,
        #         },
        #         {
        #             clientId: args.clientId,
        #             isLong: args.isLong,
        #             orderId: args.orderId,
        #         }
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
        # async cancelPerpOrder(args: { symbol: string; isLong?: boolean; orderId?: BN; clientId?: BN }): Promise<string> {
        #     const debug = require("debug")(`mfi:margin-account:${this._marginfiAccount.publicKey}:utp:zo:cancel-perp-order`);
        #     debug("Cancelling perp order on 01");

        #     const ix = await this.makeCancelPerpOrderIx(args);
        #     const tx = new Transaction().add(...ix.instructions);
        #     const sig = await processTransaction(this._client.program.provider, tx);
        #     debug("Sig %s", sig);
        #     return sig;
        # }
        pass

    # Zo-specific

    async def make_create_perp_open_orders_ix(self):
        # async makeCreatePerpOpenOrdersIx(marketSymbol: string): Promise<InstructionsWrapper> {
        #     const [utpAuthority] = await this.authority();
        #     const zoProgram = await ZoClient.createProgram(this._program.provider, this.config.cluster);
        #     const zoState = await ZoClient.State.load(zoProgram, this.config.statePk);
        #     const zoMargin = await ZoClient.Margin.load(zoProgram, zoState, zoState.cache, utpAuthority);
        #     const [openOrdersPk] = await zoMargin.getOpenOrdersKeyBySymbol(marketSymbol, this.config.cluster);

        #     return {
        #     instructions: [
        #         await instructions.makeCreatePerpOpenOrdersIx(this._program, {
        #         marginfiAccount: this._marginfiAccount.publicKey,
        #         marginfiGroup: this._client.group.publicKey,
        #         utpAuthority,
        #         signer: this._client.program.provider.wallet.publicKey,
        #         zoProgram: this.config.programId,
        #         zoState: this.config.statePk,
        #         zoStateSigner: zoState.signer,
        #         zoMargin: this.address,
        #         zoControl: zoMargin.control.pubkey,
        #         zoOpenOrders: openOrdersPk,
        #         zoDexMarket: zoState.getMarketKeyBySymbol(marketSymbol),
        #         zoDexProgram: this.config.dexProgram,
        #         }),
        #     ],
        #     keys: [],
        #     };
        # }
        pass

    async def create_perp_open_orders(self):
        # async createPerpOpenOrders(symbol: string): Promise<string> {
        #     const debug = require("debug")(
        #     `mfi:margin-account:${this._marginfiAccount.publicKey}:utp:zo:create-perp-open-orders`
        #     );
        #     debug("Creating perp open orders account on 01");

        #     const createPerpOpenOrdersIx = await this.makeCreatePerpOpenOrdersIx(symbol);
        #     const tx = new Transaction().add(...createPerpOpenOrdersIx.instructions);
        #     const sig = await processTransaction(this._client.program.provider, tx);
        #     debug("Sig %s", sig);
        #     return sig;
        # }
        pass

    async def make_settle_funds_ix(self):
        # async makeSettleFundsIx(symbol: string): Promise<InstructionsWrapper> {
        #     const [utpAuthority] = await await this.authority();

        #     const zoProgram = await ZoClient.createProgram(this._program.provider, this.config.cluster);
        #     const zoState = await ZoClient.State.load(zoProgram, this.config.statePk);
        #     const zoMargin = await ZoClient.Margin.load(zoProgram, zoState, undefined, utpAuthority);

        #     const [openOrdersPk] = await zoMargin.getOpenOrdersKeyBySymbol(symbol, this.config.cluster);

        #     return {
        #     instructions: [
        #         await instructions.makeSettleFundsIx(this._client.program, {
        #         marginfiAccount: this._marginfiAccount.publicKey,
        #         marginfiGroup: this._client.group.publicKey,
        #         utpAuthority: utpAuthority,
        #         signer: this._program.provider.wallet.publicKey,
        #         zoProgram: zoProgram.programId,
        #         state: zoState.pubkey,
        #         stateSigner: zoState.signer,
        #         cache: zoState.cache.pubkey,
        #         margin: zoMargin.pubkey,
        #         control: zoMargin.control.pubkey,
        #         openOrders: openOrdersPk,
        #         dexMarket: zoState.getMarketKeyBySymbol(symbol),
        #         dexProgram: this.config.dexProgram,
        #         }),
        #     ],
        #     keys: [],
        #     };
        # }
        pass

    async def settle_funds(self):
        #  async settleFunds(symbol: string): Promise<string> {
        #     const debug = require("debug")(`mfi:margin-account:${this._marginfiAccount.publicKey}:utp:zo:settle-funds`);
        #     debug(`Settling funds on market ${symbol}`);
        #     const ix = await this.makeSettleFundsIx(symbol);
        #     const tx = new Transaction().add(...ix.instructions);
        #     const sig = processTransaction(this._client.program.provider, tx);
        #     debug("Sig %s", sig);
        #     return sig;
        # }
        pass

    async def get_zo_state(self):
        # async getZoState(): Promise<ZoClient.State> {
        #     const zoProgram = await ZoClient.createProgram(this._program.provider, this.config.cluster);
        #     return ZoClient.State.load(zoProgram, this.config.statePk);
        # }
        pass

    async def get_zo_margin(self):
        # async getZoMargin(zoState?: ZoClient.State): Promise<ZoClient.Margin> {
        #     const [utpAuthority] = await this.authority();

        #     if (!zoState) {
        #     zoState = await this.getZoState();
        #     }

        #     const zoProgram = zoState.program;
        #     const zoMargin = await ZoClient.Margin.load(zoProgram, zoState, undefined, utpAuthority);

        #     return zoMargin;
        # }
        pass

    async def observe(self):
        # async observe(): Promise<UtpObservation> {
        #     const debug = require("debug")(`mfi:utp:${this.address}:zo:local-observe`);
        #     debug("Observing Locally");

        #     const zoMargin = await this.getZoMargin();

        #     const equity = new BigNumber(zoMargin.unweightedAccountValue.toString());
        #     const initMarginRequirement = new BigNumber(zoMargin.initialMarginInfo(null)[0].toString());
        #     const freeCollateral = new BigNumber(zoMargin.freeCollateralValue.toString());
        #     const isRebalanceDepositNeeded = equity.lt(initMarginRequirement); // TODO: Check disconnect between equity/freeCollateral/initMarginRequirement according 01 and our terminology
        #     const maxRebalanceDepositAmount = BigNumber.max(0, initMarginRequirement.minus(equity));
        #     const isEmpty = equity.lt(DUST_THRESHOLD);

        #     const observation = new UtpObservation({
        #     timestamp: new Date(),
        #     equity,
        #     freeCollateral,
        #     initMarginRequirement,
        #     liquidationValue: equity,
        #     isRebalanceDepositNeeded,
        #     maxRebalanceDepositAmount,
        #     isEmpty,
        #     });
        #     this._cachedObservation = observation;
        #     return observation;
        # }
        # }
        pass

    def get_zo_margin_address(
        self,
        authority: PublicKey,
    ) -> Tuple[PublicKey, int]:
        """[Internal] Compute the Mango account PDA tied to the specified user."""

        return PublicKey.find_program_address(
            [bytes(authority), bytes(self.config.state_pk), b"marginv1"],
            self.config.program_id,
        )
