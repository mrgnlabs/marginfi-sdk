from __future__ import annotations

from logging import Logger
from typing import TYPE_CHECKING, List, Tuple

from marginpy.logger import get_logger
from marginpy.marginpy import utp_observation
from marginpy.types import InstructionsWrapper
from marginpy.utils.data_conversion import (
    b64str_to_bytes,
    json_to_account_info,
    ui_to_native,
)
from marginpy.utils.instructions import make_request_units_ix
from marginpy.utils.pda import get_bank_authority
from marginpy.utp.account import UtpAccount
from marginpy.utp.observation import UtpObservation
from marginpy.utp.zo.instructions import (
    ActivateAccounts,
    ActivateArgs,
    CancelPerpOrderAccounts,
    CancelPerpOrderArgs,
    CreatePerpOpenOrdersAccounts,
    DepositAccounts,
    DepositArgs,
    PlacePerpOrderAccounts,
    PlacePerpOrderArgs,
    SettleFundsAccounts,
    WithdrawAccounts,
    WithdrawArgs,
    make_activate_ix,
    make_cancel_perp_order_ix,
    make_create_perp_open_orders_ix,
    make_deposit_ix,
    make_place_perp_order_ix,
    make_settle_funds_ix,
    make_withdraw_ix,
)
from marginpy.utp.zo.utils import CONTROL_ACCOUNT_SIZE
from marginpy.utp.zo.utils.client import Zo
from marginpy.utp.zo.utils.client.types import ZoOrderType
from marginpy.utp.zo.utils.client.util import (
    compute_taker_fee,
    price_to_lots,
    size_to_lots,
)
from solana.keypair import Keypair
from solana.publickey import PublicKey
from solana.rpc.types import RPCResponse
from solana.system_program import CreateAccountParams, create_account
from solana.transaction import AccountMeta, Transaction, TransactionSignature

if TYPE_CHECKING:
    from marginpy import MarginfiAccount, MarginfiClient
    from marginpy.types import UtpData


class UtpZoAccount(UtpAccount):
    """
    [internal] 01 proxy, encapsulating 01-specific interactions.

    !! Do not instantiate on its own !!
    """

    def __init__(
        self,
        client: MarginfiClient,
        marginfi_account: MarginfiAccount,
        account_data: "UtpData",
    ):
        """
        [internal]
        """
        super().__init__(
            client,
            marginfi_account,
            account_data.is_active,
            account_data.account_config,
        )

    # --- Getters / Setters

    @property
    def config(self):
        """
        Gets 01-specific config.
        """

        return self._config.zo

    # --- Others

    async def make_activate_ix(self) -> InstructionsWrapper:
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
        logger = self.get_logger()
        logger.debug("Activating 01 UTP")

        ix = await self.make_activate_ix()
        tx = Transaction().add(*ix.instructions)
        sig = await self._client.program.provider.send(tx, ix.signers)
        logger.debug("Deposit successful: %s", sig)
        await self._marginfi_account.reload()
        return sig

    async def make_deactivate_ix(self) -> InstructionsWrapper:
        return await self._marginfi_account._make_deactivate_utp_ix(  # pylint: disable=protected-access
            self.index
        )

    async def deactivate(self) -> TransactionSignature:
        logger = self.get_logger()
        logger.debug("Deactivating 01 UTP")

        self.throw_if_not_active()
        sig = await self._marginfi_account._deactivate_utp(  # pylint: disable=protected-access
            self.index
        )
        logger.debug("Deactivation successful: %s", sig)
        await self._marginfi_account.reload()
        return sig

    async def make_deposit_ix(self, ui_amount: float) -> InstructionsWrapper:
        proxy_token_account_key = Keypair()

        zo_authority_pk, _ = await self.authority()
        margin_bank_authority_pk, _ = get_bank_authority(
            self._config.group_pk, self._program.program_id
        )

        create_proxy_token_account_ixs = await self.make_create_proxy_token_account_ixs(
            proxy_token_account_key,
            zo_authority_pk,
        )

        zo = await self.get_zo_client(self.address)

        remaining_accounts = await self._marginfi_account.get_observation_accounts()
        deposit_ix = make_deposit_ix(
            args=DepositArgs(amount=ui_to_native(ui_amount)),
            accounts=DepositAccounts(
                marginfi_account=self._marginfi_account.pubkey,
                marginfi_group=self._config.group_pk,
                signer=self._program.provider.wallet.public_key,
                margin_collateral_vault=self._marginfi_account.group.bank.vault,
                bank_authority=margin_bank_authority_pk,
                temp_collateral_account=proxy_token_account_key.public_key,
                utp_authority=zo_authority_pk,
                zo_cache=zo.state.cache,
                zo_margin=self.address,
                zo_program=self.config.program_id,
                zo_state=zo.config.zo_state_id,
                zo_state_signer=zo.state_signer,
                zo_vault=zo.collaterals[self._marginfi_account.group.bank.mint].vault,
            ),
            program_id=self._client.program_id,
            remaining_accounts=remaining_accounts,
        )

        return InstructionsWrapper(
            instructions=[
                *create_proxy_token_account_ixs.instructions,
                deposit_ix,
            ],
            signers=[proxy_token_account_key],
        )

    async def deposit(self, ui_amount: float) -> TransactionSignature:
        logger = self.get_logger()
        logger.debug("Depositing %s USDC to 01 UTP", ui_amount)

        self.throw_if_not_active()

        ix = await self.make_deposit_ix(ui_amount)
        tx = Transaction().add(*ix.instructions)
        sig = await self._client.program.provider.send(tx=tx, signers=ix.signers)
        logger.debug("Deposit successful: %s", sig)
        return sig

    async def make_withdraw_ix(self, ui_amount: float) -> InstructionsWrapper:
        zo_authority_pk, _ = await self.authority()

        zo = await self.get_zo_client(self.address)

        remaining_accounts = await self._marginfi_account.get_observation_accounts()
        ix = make_withdraw_ix(
            args=WithdrawArgs(amount=ui_to_native(ui_amount)),
            accounts=WithdrawAccounts(
                marginfi_account=self._marginfi_account.pubkey,
                marginfi_group=self._config.group_pk,
                signer=self._program.provider.wallet.public_key,
                margin_collateral_vault=self._marginfi_account.group.bank.vault,
                utp_authority=zo_authority_pk,
                zo_cache=zo.state.cache,
                zo_margin=self.address,
                zo_control=zo.margin.control,
                zo_program=self.config.program_id,
                zo_state=zo.config.zo_state_id,
                zo_state_signer=zo.state_signer,
                zo_heimdall=self.config.heimdall,
                zo_vault=zo.collaterals[self._marginfi_account.group.bank.mint].vault,
            ),
            program_id=self._client.program_id,
            remaining_accounts=remaining_accounts,
        )

        return InstructionsWrapper(instructions=[ix], signers=[])

    async def withdraw(self, ui_amount: float) -> TransactionSignature:
        logger = self.get_logger()
        logger.debug("Withdrawing %s USDC from 01 UTP", ui_amount)

        ix = await self.make_withdraw_ix(ui_amount)
        tx = Transaction().add(*ix.instructions)
        sig = await self._client.program.provider.send(tx)
        logger.debug("Withdrawal successful: %s", sig)
        return sig

    async def make_place_perp_order_ix(  # pylint: disable=too-many-arguments, too-many-locals
        self,
        market_symbol: str,
        order_type: ZoOrderType,
        is_long: bool,
        price: float,
        size: float,
        limit: int = 10,
        client_id: int = 0,
    ) -> InstructionsWrapper:
        logger = self.get_logger()

        request_cu_ix = make_request_units_ix(units=400_000, additional_fee=0)

        zo_authority_pk, _ = await self.authority()

        zo = await self.get_zo_client(self.address)
        market_info = zo.markets[market_symbol]
        market = zo.dex_markets[market_symbol]
        oo_pk, _ = self.get_oo_adress_for_market(zo.margin.control, market_info.address)

        price = price_to_lots(
            price,
            base_decimals=market_info.base_decimals,
            quote_decimals=market_info.quote_decimals,
            base_lot_size=market_info.base_lot_size,
            quote_lot_size=market_info.quote_lot_size,
        )
        taker_fee = compute_taker_fee(market_info.perp_type)
        fee_multiplier = 1 + taker_fee if is_long else 1 - taker_fee
        max_base_quantity = size_to_lots(
            size, decimals=market_info.base_decimals, lot_size=market_info.base_lot_size
        )
        max_quote_quantity = round(
            price * fee_multiplier * max_base_quantity * market_info.quote_lot_size
        )

        remaining_accounts = await self._marginfi_account.get_observation_accounts()

        args = PlacePerpOrderArgs(
            is_long=is_long,
            order_type=order_type.to_program_type(),
            limit=limit,
            limit_price=price,
            client_id=client_id,
            max_base_quantity=max_base_quantity,
            max_quote_quantity=max_quote_quantity,
        )
        logger.debug(args)

        place_order_ix = make_place_perp_order_ix(
            args,
            PlacePerpOrderAccounts(
                marginfi_account=self._marginfi_account.pubkey,
                marginfi_group=self._config.group_pk,
                signer=self._program.provider.wallet.public_key,
                utp_authority=zo_authority_pk,
                zo_program=self.config.program_id,
                state=self.config.state_pk,
                state_signer=zo.state_signer,
                cache=zo.state.cache,
                margin=self.address,
                control=zo.margin.control,
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
            instructions=[request_cu_ix, place_order_ix],
            signers=[],
        )

    async def place_perp_order(  # pylint: disable=too-many-arguments
        self,
        market_symbol: str,
        order_type: ZoOrderType,
        is_long: bool,
        price: float,
        size: float,
        limit: int = 10,
        client_id: int = 0,
    ) -> TransactionSignature:
        logger = self.get_logger()
        logger.debug("Placing %s perp order on 01 UTP", market_symbol)

        self.throw_if_not_active()

        ix = await self.make_place_perp_order_ix(
            market_symbol, order_type, is_long, price, size, limit, client_id
        )
        tx = Transaction().add(*ix.instructions)
        sig = await self._client.program.provider.send(tx=tx, signers=ix.signers)
        logger.debug("Place order successful: %s", sig)
        return sig

    async def make_cancel_perp_order_ix(
        self,
        market_symbol: str,
        order_id: int = None,
        is_long: bool = None,
        client_id: int = None,
    ) -> InstructionsWrapper:
        zo_authority_pk, _ = await self.authority()

        zo = await self.get_zo_client(self.address)
        market_info = zo.markets[market_symbol]
        market = zo.dex_markets[market_symbol]
        oo_pk, _ = self.get_oo_adress_for_market(zo.margin.control, market_info.address)

        remaining_accounts = await self._marginfi_account.get_observation_accounts()

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
                cache=zo.state.cache,
                margin=self.address,
                control=zo.margin.control,
                open_orders=oo_pk,
                dex_market=market_info.address,
                market_bids=market.bids,
                market_asks=market.asks,
                event_q=market.event_q,
                dex_program=self.config.dex_program,
            ),
            self._client.program_id,
            remaining_accounts,
        )

        return InstructionsWrapper(
            instructions=[cancel_ix],
            signers=[],
        )

    async def cancel_perp_order(
        self,
        market_symbol: str,
        order_id: int = None,
        is_long: bool = None,
        client_id: int = None,
    ) -> TransactionSignature:
        logger = self.get_logger()
        logger.debug("Canceling %s perp order on 01 UTP", market_symbol)

        self.throw_if_not_active()

        ix = await self.make_cancel_perp_order_ix(
            market_symbol, order_id, is_long, client_id
        )
        tx = Transaction().add(*ix.instructions)
        sig = await self._client.program.provider.send(tx=tx, signers=ix.signers)
        logger.debug("Cancel order successful: %s", sig)
        return sig

    # Zo-specific

    async def make_create_perp_open_orders_ix(
        self,
        market_symbol: str,
    ) -> InstructionsWrapper:
        zo_authority_pk, _ = await self.authority()

        zo = await self.get_zo_client(self.address)

        market_info = zo.markets[market_symbol]
        oo_pk, _ = self.get_oo_adress_for_market(zo.margin.control, market_info.address)

        create_oo_ix = make_create_perp_open_orders_ix(
            CreatePerpOpenOrdersAccounts(
                marginfi_account=self._marginfi_account.pubkey,
                marginfi_group=self._config.group_pk,
                utp_authority=zo_authority_pk,
                signer=self._program.provider.wallet.public_key,
                zo_program=self.config.program_id,
                state=self.config.state_pk,
                state_signer=zo.state_signer,
                margin=self.address,
                control=zo.margin.control,
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

    async def create_perp_open_orders(self, market_symbol: str) -> TransactionSignature:
        logger = self.get_logger()
        logger.debug("Creating perp open order account on 01 UTP")

        self.throw_if_not_active()

        ix = await self.make_create_perp_open_orders_ix(market_symbol)
        tx = Transaction().add(*ix.instructions)
        sig = await self._client.program.provider.send(tx=tx, signers=ix.signers)
        logger.debug("Open order account creation successful: %s", sig)
        return sig

    async def make_settle_funds_ix(self, market_symbol: str) -> InstructionsWrapper:
        zo_authority_pk, _ = await self.authority()

        zo = await self.get_zo_client(self.address)
        market_info = zo.markets[market_symbol]
        oo_pk, _ = self.get_oo_adress_for_market(zo.margin.control, market_info.address)

        settle_funds_ix = make_settle_funds_ix(
            SettleFundsAccounts(
                marginfi_account=self._marginfi_account.pubkey,
                marginfi_group=self._config.group_pk,
                signer=self._program.provider.wallet.public_key,
                utp_authority=zo_authority_pk,
                zo_program=self.config.program_id,
                state=self.config.state_pk,
                state_signer=zo.state_signer,
                cache=zo.state.cache,
                margin=self.address,
                control=zo.margin.control,
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

    async def settle_funds(self, market_symbol: str) -> TransactionSignature:
        logger = self.get_logger()
        logger.debug("Settling %s funds on 01 UTP", market_symbol)

        self.throw_if_not_active()

        ix = await self.make_settle_funds_ix(market_symbol)
        tx = Transaction().add(*ix.instructions)
        sig = await self._client.program.provider.send(tx=tx, signers=ix.signers)
        logger.debug("Settlement successful: %s", sig)
        return sig

    async def get_observation_accounts(self) -> List[AccountMeta]:
        """
        Creates list of account metas required to observe a Zo account.
        """

        zo = await self.get_zo_client(self.address)

        return [
            AccountMeta(
                pubkey=self.address,
                is_signer=False,
                is_writable=False,
            ),
            AccountMeta(
                pubkey=zo.margin.control,
                is_signer=False,
                is_writable=False,
            ),
            AccountMeta(
                pubkey=self.config.state_pk,
                is_signer=False,
                is_writable=False,
            ),
            AccountMeta(
                pubkey=zo.state.cache,
                is_signer=False,
                is_writable=False,
            ),
        ]

    async def observe(self) -> UtpObservation:
        """
        Retrieves the 01 observation directly from the 01 accounts and refreshes the cache.
        """

        logger = self.get_logger()
        logger.debug("Observing 01 accounts")

        pubkeys = [m.pubkey for m in await self.get_observation_accounts()]

        response: RPCResponse = await self._program.provider.connection.get_multiple_accounts(
            pubkeys  # type: ignore
        )
        if "error" in response.keys():
            raise Exception(f"Error while fetching {pubkeys}: {response['error']}")
        (zo_margin_json, zo_control_json, zo_state_json, zo_cache_json) = response[
            "result"
        ]["value"]
        if zo_margin_json is None:
            raise Exception(f"01 margin {pubkeys[0]} not found")
        if zo_control_json is None:
            raise Exception(f"01 control {pubkeys[1]} not found")
        if zo_state_json is None:
            raise Exception(f"01 state {pubkeys[2]} not found")
        if zo_cache_json is None:
            raise Exception(f"01 state {pubkeys[3]} not found")

        zo_margin_data = b64str_to_bytes(json_to_account_info(zo_margin_json).data[0])  # type: ignore
        zo_control_data = b64str_to_bytes(json_to_account_info(zo_control_json).data[0])  # type: ignore
        zo_state_data = b64str_to_bytes(json_to_account_info(zo_state_json).data[0])  # type: ignore
        zo_cache_data = b64str_to_bytes(json_to_account_info(zo_cache_json).data[0])  # type: ignore

        observation = utp_observation.zo.get_observation(
            zo_cache_data=zo_cache_data,
            zo_control_data=zo_control_data,
            zo_margin_data=zo_margin_data,
            zo_state_data=zo_state_data,
        )

        self._cached_observation = UtpObservation.from_raw(observation)
        return self._cached_observation

    def get_zo_margin_address(
        self,
        authority: PublicKey,
    ) -> Tuple[PublicKey, int]:
        """
        [internal] Computes the 01 account PDA tied to the specified user.
        """

        return PublicKey.find_program_address(
            [bytes(authority), bytes(self.config.state_pk), b"marginv1"],
            self.config.program_id,
        )

    async def get_zo_client(self, margin_pk: PublicKey = None) -> Zo:
        return await Zo.new(
            conn=self._program.provider.connection,
            cluster=self.config.cluster,
            tx_opts=self._program.provider.opts,
            payer=self._program.provider.wallet.payer,
            margin_pk=margin_pk,
        )

    def get_oo_adress_for_market(
        self,
        zo_control: PublicKey,
        market_address: PublicKey,
    ) -> Tuple[PublicKey, int]:
        """
        [internal] Compute the 01 account PDA tied to the specified user.
        """

        return PublicKey.find_program_address(
            [bytes(zo_control), bytes(market_address)],
            self.config.dex_program,
        )

    def get_logger(self) -> Logger:
        return get_logger(f"{__name__}.UtpZoAccount.{self.address}")
