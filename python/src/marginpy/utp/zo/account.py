from __future__ import annotations

from marginpy.utils import get_bank_authority, ui_to_native
from marginpy.utp.account import UtpAccount
from marginpy.types import InstructionsWrapper, UtpData
from solana.keypair import Keypair
from solana.transaction import (
    AccountMeta,
    Transaction,
    TransactionSignature,
    TransactionInstruction,
)
from solana.system_program import create_account, CreateAccountParams
from solana.publickey import PublicKey
from typing import TYPE_CHECKING, List, Tuple, Optional
from marginpy.utp.zo.instruction import (
    ActivateAccounts,
    ActivateArgs,
    CreatePerpOpenOrdersAccounts,
    DepositAccounts,
    DepositArgs,
    WithdrawAccounts,
    WithdrawArgs,
    PlacePerpOrderArgs,
    PlacePerpOrderAccounts,
    CancelPerpOrderArgs,
    CancelPerpOrderAccounts,
    SettleFundsAccounts,
    make_activate_ix,
    make_create_perp_open_orders_ix,
    make_deposit_ix,
    make_withdraw_ix,
    make_place_perp_order_ix,
    make_cancel_perp_order_ix,
    make_settle_funds_ix,
)
from marginpy.utp.zo.utils import CONTROL_ACCOUNT_SIZE
from marginpy.utp.zo.utils.copy_pasta.zo import Zo
from marginpy.utp.zo.utils.copy_pasta.config import configs

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

    async def make_deactivate_ix(self) -> TransactionInstruction:
        """
        Create transaction instruction to deactivate Mango.

        :returns: `DeactivateUtp` transaction instruction
        """
        return self._marginfi_account.make_deactivate_utp_ix(self.index)

    async def deactivate(self) -> TransactionSignature:
        """
        Deactivate UTP.

        :returns: Transaction signature
        """

        self.verify_active()
        sig = await self._marginfi_account.deactivate_utp(self.index)
        await self._marginfi_account.reload()
        return sig

    async def make_deposit_ix(
        self, amount: float
    ) -> Tuple[List[TransactionInstruction], Keypair]:
        """
        Create transaction instruction to deposit collateral into the Mango account.

        :param amount Amount to deposit (mint native unit)
        :returns Transaction instruction
        """

        proxy_token_account_key = Keypair()

        zo_authority_pk, _ = await self.authority()
        margin_bank_authority_pk, _ = get_bank_authority(
            self._config.group_pk, self._program.program_id
        )

        create_proxy_token_account_ixs = await self.make_create_proxy_token_account_ixs(
            proxy_token_account_key.public_key,
            zo_authority_pk,
        )

        zo = await Zo.new(
            conn=self._program.provider.connection,
            cluster=self.config.cluster,
            tx_opts=self._program.provider.opts,
            payer=self._program.provider.wallet.payer,
            create_margin=False,
            load_margin=False,
        )

        remaining_accounts = await self.get_observation_accounts()

        zo_state = configs[self.config.cluster].ZO_STATE_ID

        return (
            [
                *create_proxy_token_account_ixs,
                make_deposit_ix(
                    args=DepositArgs(amount=ui_to_native(amount)),
                    accounts=DepositAccounts(
                        marginfi_account=self._marginfi_account.pubkey,
                        marginfi_group=self._config.group_pk,
                        signer=self._program.provider.wallet.public_key,
                        margin_collateral_vault=self._marginfi_account.group.bank.vault,
                        bank_authority=margin_bank_authority_pk,
                        temp_collateral_account=proxy_token_account_key.public_key,
                        utp_authority=zo_authority_pk,
                        zo_cache=zo._zo_state.cache,
                        zo_margin=self.address,
                        zo_program=self.config.program_id,
                        zo_state=zo_state,
                        zo_state_signer=zo._zo_state_signer,
                        zo_vault=zo.collaterals[
                            self._marginfi_account.group.bank.mint
                        ].vault,
                    ),
                    program_id=self._client.program_id,
                    remaining_accounts=remaining_accounts,
                ),
            ],
            proxy_token_account_key,
        )

    async def deposit(self, amount: float) -> TransactionSignature:
        """
        Deposit collateral into the 01 account.

        :param amount: Amount to deposit (mint native unit)
        :returns: Transaction signature
        """

        self.verify_active()

        deposit_ixs, proxy_token_account_key = await self.make_deposit_ix(amount)

        tx = Transaction().add(*deposit_ixs)
        return await self._client.program.provider.send(
            tx=tx, signers=[proxy_token_account_key]
        )

    async def make_withdraw_ix(self, amount: float) -> TransactionInstruction:
        """
        Create transaction instruction to withdraw from the 01 account to the marginfi account.

        :param amount: amount to deposit (mint native unit)
        :returns: Transaction instruction
        """

        zo_authority_pk, _ = await self.authority()

        margin = await self.get_zo_margin()
        zo_state = configs[self.config.cluster].ZO_STATE_ID
        zo = await Zo.new(
            conn=self._program.provider.connection,
            cluster=self.config.cluster,
            tx_opts=self._program.provider.opts,
            payer=self._program.provider.wallet.payer,
            create_margin=False,
            load_margin=False,
        )
        remaining_accounts = await self.get_observation_accounts()

        return make_withdraw_ix(
            args=WithdrawArgs(amount=ui_to_native(amount)),
            accounts=WithdrawAccounts(
                marginfi_account=self._marginfi_account.pubkey,
                marginfi_group=self._config.group_pk,
                signer=self._program.provider.wallet.public_key,
                margin_collateral_vault=self._marginfi_account.group.bank.vault,
                utp_authority=zo_authority_pk,
                zo_cache=zo._zo_state.cache,
                zo_margin=self.address,
                zo_control=margin.control,
                zo_program=self.config.program_id,
                zo_state=zo_state,
                zo_state_signer=zo._zo_state_signer,
                zo_vault=zo.collaterals[self._marginfi_account.group.bank.mint].vault,
            ),
            program_id=self._client.program_id,
            remaining_accounts=remaining_accounts,
        )

    async def withdraw(self, amount: float) -> TransactionSignature:
        """
        Withdraw from the Zo account to the marginfi account.

        :param amount Amount to deposit (mint native unit)
        :returns: Transaction signature
        """

        withdraw_ix = await self.make_withdraw_ix(amount)
        tx = Transaction().add(withdraw_ix)
        return await self._client.program.provider.send(tx)

    async def get_observation_accounts(self) -> List[AccountMeta]:
        """
        Create list of account metas required to observe a Zo account.

        :returns: `AccountMeta[]` list of account metas
        """

        # TODO: change to 1 fetch for both accounts + decoding
        zo = await Zo.new(
            conn=self._program.provider.connection,
            cluster=self.config.cluster,
            tx_opts=self._program.provider.opts,
            payer=self._program.provider.wallet.payer,
            create_margin=False,
            load_margin=False,
        )
        state = await self.get_zo_state()
        margin = await self.get_zo_margin()

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

    async def make_place_perp_order_ix(self, args):
        """
        Create transaction instruction to place a perp order.

        :returns: Transaction instruction
        """
        zo_authority_pk, _ = await self.authority()

        zo = await Zo.new(
            conn=self._program.provider.connection,
            cluster=self.config.cluster,
            tx_opts=self._program.provider.opts,
            payer=self._program.provider.wallet.payer,
            create_margin=False,
            load_margin=False,
        )
        margin = await self.get_zo_margin()
        market_info = zo.markets[args.market_symbol]
        market = zo.__dex_markets[args.market_symbol]
        oo_pk, _ = self.get_oo_adress_for_market(margin.control, market_info.address)

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

        remaining_accounts = await self.get_observation_accounts()

        place_order_ix = make_place_perp_order_ix(
            PlacePerpOrderArgs(args=args),
            PlacePerpOrderAccounts(
                marginfi_account=self._marginfi_account.pubkey,
                marginfi_group=self._config.group_pk,
                signer=self._program.provider.wallet.public_key,
                utp_authority=zo_authority_pk,
                zo_program=self.config.program_id,
                state=self.config.state_pk,
                state_signer=zo._zo_state_signer,
                cache=zo._zo_state.cache,
                margin=self.address,
                control=margin.control,
                open_orders=oo_pk,
                dex_market=market_info.address,
                req_q=market.req_q,
                event_q=market.event_q,
                market_bids=market.bids,
                market_asks=market.asks,
                dex_program=self.config.dex_program,
            ),
            self._client.program_id,
            remaining_accounts=remaining_accounts,
        )

        return InstructionsWrapper(
            instructions=[place_order_ix],
            signers=[],
        )

    async def place_perp_order(self, args):
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
        
        self.verify_active()

        # https://github.com/solana-labs/solana-web3.js/blob/091faf5/src/compute-budget.ts#L180
        # layout: BufferLayout.struct<
        #     ComputeBudgetInstructionInputData['RequestUnits']
        #     >([
        #     BufferLayout.u8('instruction'),
        #     BufferLayout.u32('units'),
        #     BufferLayout.u32('additionalFee'),
        #     ]),
        # static requestUnits(params: RequestUnitsParams): TransactionInstruction {
        #     const type = COMPUTE_BUDGET_INSTRUCTION_LAYOUTS.RequestUnits;
        #     const data = encodeData(type, params);
        #     return new TransactionInstruction({
        #     keys: [],
        #     programId: this.programId,
        #     data,
        #     });
        # }
        #
        #     units: 400000,
        #     additionalFee: 0,

        place_order_ix_wrapped = await self.make_place_perp_order_ix(args)

        tx = Transaction().add(*place_order_ix_wrapped.instructions)
        return await self._client.program.provider.send(
            tx=tx, signers=place_order_ix_wrapped.signers
        )

    async def make_cancel_perp_order_ix(
        self,
        market_symbol: str,
        order_id: Optional[int],
        is_long: Optional[bool],
        client_id: Optional[int],
    ):
        """
        Create transaction instruction to cancel a perp order.

        :returns: Transaction instruction
        """
        zo_authority_pk, _ = await self.authority()

        zo = await Zo.new(
            conn=self._program.provider.connection,
            cluster=self.config.cluster,
            tx_opts=self._program.provider.opts,
            payer=self._program.provider.wallet.payer,
            create_margin=False,
            load_margin=False,
        )
        margin = await self.get_zo_margin()
        market_info = zo.markets[market_symbol]
        market = zo.__dex_markets[market_symbol]
        oo_pk, _ = self.get_oo_adress_for_market(margin.control, market_info.address)

        cancel_ix = make_cancel_perp_order_ix(
            CancelPerpOrderArgs(
                order_id=order_id,
                is_long=is_long,
                client_id=client_id,
            ),
            CancelPerpOrderAccounts(
                marginfi_account=self._marginfi_account.pubkey,
                marginfi_group=self._config.group_pk,
                signer=self._program.provider.wallet.public_key,
                utp_authority=zo_authority_pk,
                zo_program=self.config.program_id,
                state=self.config.state_pk,
                cache=zo._zo_state.cache,
                margin=self.address,
                control=margin.control,
                open_orders=oo_pk,
                dex_market=market_info.address,
                market_bids=market.bids,
                market_asks=market.asks,
                event_q=market.event_q,
                dex_program=self.config.dex_program,
            ),
            self._client.program_id,
        )

        return InstructionsWrapper(
            instructions=[cancel_ix],
            signers=[],
        )

    async def cancel_perp_order(
        self,
        market_symbol: str,
        order_id: Optional[int],
        is_long: Optional[bool],
        client_id: Optional[int],
    ):
        """
        Cancel a perp order.

        :returns: Transaction signature
        """
        self.verify_active()

        cancel_ix_wrapped = await self.make_cancel_perp_order_ix(
            market_symbol, order_id, is_long, client_id
        )

        tx = Transaction().add(*cancel_ix_wrapped.instructions)
        return await self._client.program.provider.send(
            tx=tx, signers=cancel_ix_wrapped.signers
        )

    # Zo-specific

    async def make_create_perp_open_orders_ix(
        self,
        market_symbol: str,
    ) -> InstructionsWrapper:
        zo_authority_pk, _ = await self.authority()

        zo = await Zo.new(
            conn=self._program.provider.connection,
            cluster=self.config.cluster,
            tx_opts=self._program.provider.opts,
            payer=self._program.provider.wallet.payer,
            create_margin=False,
            load_margin=False,
        )
        margin = await self.get_zo_margin()
        market_info = zo.markets[market_symbol]
        oo_pk, _ = self.get_oo_adress_for_market(margin.control, market_info.address)

        create_oo_ix = make_create_perp_open_orders_ix(
            CreatePerpOpenOrdersAccounts(
                marginfi_account=self._marginfi_account.pubkey,
                marginfi_group=self._config.group_pk,
                utp_authority=zo_authority_pk,
                signer=self._program.provider.wallet.public_key,
                zo_program=self.config.program_id,
                state=self.config.state_pk,
                state_signer=zo._zo_state_signer,
                margin=self.address,
                control=margin.control,
                open_orders=oo_pk,
                dex_market=market_info.address,
                dex_program=self.config.dex_program,
            ),
            self._client.program_id,
        )

        return InstructionsWrapper(
            instructions=[create_oo_ix],
            signers=[],
        )

    async def create_perp_open_orders(self, market_symbol: str):
        self.verify_active()

        create_perp_open_orders_ix_wrapped = await self.make_create_perp_open_orders_ix(
            market_symbol
        )

        tx = Transaction().add(*create_perp_open_orders_ix_wrapped.instructions)
        return await self._client.program.provider.send(
            tx=tx, signers=create_perp_open_orders_ix_wrapped.signers
        )

    async def make_settle_funds_ix(self, market_symbol: str):
        zo_authority_pk, _ = await self.authority()

        zo = await Zo.new(
            conn=self._program.provider.connection,
            cluster=self.config.cluster,
            tx_opts=self._program.provider.opts,
            payer=self._program.provider.wallet.payer,
            create_margin=False,
            load_margin=False,
        )
        margin = await self.get_zo_margin()
        market_info = zo.markets[market_symbol]
        oo_pk, _ = self.get_oo_adress_for_market(margin.control, market_info.address)

        settle_funds_ix = make_settle_funds_ix(
            SettleFundsAccounts(
                marginfi_account=self._marginfi_account.pubkey,
                marginfi_group=self._config.group_pk,
                signer=self._program.provider.wallet.public_key,
                utp_authority=zo_authority_pk,
                zo_program=self.config.program_id,
                state=self.config.state_pk,
                state_signer=zo._zo_state_signer,
                cache=zo._zo_state.cache,
                margin=self.address,
                control=margin.control,
                open_orders=oo_pk,
                dex_market=market_info.address,
                dex_program=self.config.dex_program,
            ),
            self._client.program_id,
        )

        return InstructionsWrapper(
            instructions=[settle_funds_ix],
            signers=[],
        )

    async def settle_funds(self, market_symbol: str):
        self.verify_active()

        settle_ix_wrapped = await self.make_settle_funds_ix(
            market_symbol
        )

        tx = Transaction().add(*settle_ix_wrapped.instructions)
        return await self._client.program.provider.send(
            tx=tx, signers=settle_ix_wrapped.signers
        )

    async def get_zo_state(self):
        zo = await Zo.new(
            conn=self._program.provider.connection,
            cluster=self.config.cluster,
            tx_opts=self._program.provider.opts,
            payer=self._program.provider.wallet.payer,
            create_margin=False,
            load_margin=False,
        )
        return await zo.program.account["State"].fetch(
            self.config.state_pk, self._program.provider.opts.preflight_commitment
        )

    async def get_zo_margin(self):
        zo = await Zo.new(
            conn=self._program.provider.connection,
            cluster=self.config.cluster,
            tx_opts=self._program.provider.opts,
            payer=self._program.provider.wallet.payer,
            create_margin=False,
            load_margin=False,
        )
        return await zo.program.account["Margin"].fetch(
            self.address, self._program.provider.opts.preflight_commitment
        )

    async def observe(self):
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

    def get_oo_adress_for_market(
        self,
        zo_control: PublicKey,
        market_address: PublicKey,
    ) -> Tuple[PublicKey, int]:
        """[Internal] Compute the Mango account PDA tied to the specified user."""
        return PublicKey.find_program_address(
            [bytes(zo_control), bytes(market_address)],
            self.config.dex_program,
        )
