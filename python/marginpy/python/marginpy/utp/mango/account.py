from __future__ import annotations

from datetime import datetime
from typing import TYPE_CHECKING, List, Tuple

import mango
from marginpy.logger import get_logger
from marginpy.marginpy import utp_observation
from marginpy.types import InstructionsWrapper
from marginpy.utils.data_conversion import (
    b64str_to_bytes,
    json_to_account_info,
    ui_to_native,
)
from marginpy.utils.pda import get_bank_authority
from marginpy.utp.account import UtpAccount
from marginpy.utp.mango.config import MangoConfig
from marginpy.utp.mango.instructions import (
    ActivateAccounts,
    ActivateArgs,
    CancelPerpOrderAccounts,
    CancelPerpOrderArgs,
    DepositAccounts,
    DepositArgs,
    PlacePerpOrderAccounts,
    PlacePerpOrderArgs,
    WithdrawAccounts,
    WithdrawArgs,
    make_activate_ix,
    make_cancel_perp_order_ix,
    make_deposit_ix,
    make_place_perp_order_ix,
    make_withdraw_ix,
)
from marginpy.utp.mango.types import (
    USDC_TOKEN_DICT,
    MangoExpiryType,
    MangoOrderType,
    UtpMangoPlacePerpOrderOptions,
)
from marginpy.utp.observation import UtpObservation
from solana.keypair import Keypair
from solana.publickey import PublicKey
from solana.rpc.types import RPCResponse
from solana.transaction import AccountMeta, Transaction, TransactionSignature

if TYPE_CHECKING:
    from marginpy import MarginfiAccount, MarginfiClient
    from marginpy.types import UtpData
    from marginpy.utp.mango.types import MangoSide


class UtpMangoAccount(UtpAccount):
    """
    [internal] Mango proxy, encapsulating Mango-specific interactions.

    !! Do not instantiate on its own !!
    """

    def __init__(
        self,
        client: MarginfiClient,
        marginfi_account: MarginfiAccount,
        account_data: "UtpData",
    ):
        """
        [internal] Constructor.
        """

        super().__init__(
            client,
            marginfi_account,
            account_data.is_active,
            account_data.account_config,
        )

    # --- Getters / Setters

    @property
    def config(self) -> MangoConfig:
        """
        Gets Mango-specific config.
        """

        return self._config.mango

    # --- Others

    async def make_activate_ix(self) -> InstructionsWrapper:
        authority_seed = Keypair()
        utp_authority_pk, utp_authority_bump = await self.authority(
            authority_seed.public_key
        )
        utp_account_pk, _ = get_mango_account_pda(
            self.config.group_pk,
            utp_authority_pk,
            0,
            self.config.program_id,
        )

        ix = make_activate_ix(
            ActivateArgs(
                authority_seed=authority_seed.public_key,
                authority_bump=utp_authority_bump,
            ),
            ActivateAccounts(
                marginfi_account=self._marginfi_account.pubkey,
                marginfi_group=self._config.group_pk,
                authority=self._program.provider.wallet.public_key,
                mango_authority=utp_authority_pk,
                mango_account=utp_account_pk,
                mango_program=self._config.mango.program_id,
                mango_group=self._config.mango.group_pk,
            ),
            self._client.program_id,
        )

        return InstructionsWrapper(
            instructions=[ix],
            signers=[],
        )

    async def activate(self) -> TransactionSignature:
        logger = self.get_logger()
        logger.debug("Activating Mango UTP")

        ix = await self.make_activate_ix()
        transation = Transaction().add(*ix.instructions)
        sig = await self._client.program.provider.send(transation)
        logger.debug("Deposit successful: %s", sig)
        await self._marginfi_account.reload()
        return sig

    async def make_deactivate_ix(self) -> InstructionsWrapper:
        return await self._marginfi_account._make_deactivate_utp_ix(  # pylint: disable=protected-access
            self.index
        )

    async def deactivate(self) -> TransactionSignature:
        logger = self.get_logger()
        logger.debug("Deactivating Mango UTP")

        self.throw_if_not_active()
        sig = await self._marginfi_account._deactivate_utp(  # pylint: disable=protected-access
            self.index
        )
        logger.debug("Deactivation successful: %s", sig)
        await self._marginfi_account.reload()
        return sig

    async def make_deposit_ix(self, ui_amount: float) -> InstructionsWrapper:
        proxy_token_account_key = Keypair()

        mango_authority_pk, _ = await self.authority()
        margin_bank_authority_pk, _ = get_bank_authority(
            self._config.group_pk, self._program.program_id
        )

        with mango.ContextBuilder.build(
            cluster_name=self.config.cluster,
            group_name=self.config.group_name,
        ) as context:
            mango_group = mango.Group.load(context)
            token_bank = mango_group.token_bank_by_instrument(
                USDC_TOKEN_DICT[self.config.cluster]
            )
            root_bank = token_bank.ensure_root_bank(context)
            node_bank = root_bank.pick_node_bank(context)

        root_bank_pk = root_bank.address
        node_bank_pk = node_bank.address
        vault_pk = node_bank.vault

        create_proxy_token_account_ixs = await self.make_create_proxy_token_account_ixs(
            proxy_token_account_key,
            mango_authority_pk,
        )

        deposit_ix = make_deposit_ix(
            args=DepositArgs(amount=ui_to_native(ui_amount)),
            accounts=DepositAccounts(
                marginfi_account=self._marginfi_account.pubkey,
                marginfi_group=self._config.group_pk,
                signer=self._program.provider.wallet.public_key,
                margin_collateral_vault=self._marginfi_account.group.bank.vault,
                bank_authority=margin_bank_authority_pk,
                temp_collateral_account=proxy_token_account_key.public_key,
                mango_authority=mango_authority_pk,
                mango_account=self.address,
                mango_program=self._config.mango.program_id,
                mango_group=self._config.mango.group_pk,
                mango_cache=mango_group.cache,
                mango_root_bank=root_bank_pk,
                mango_node_bank=node_bank_pk,
                mango_vault=vault_pk,
            ),
            program_id=self._client.program_id,
            remaining_accounts=await self._marginfi_account.get_observation_accounts(),
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
        logger.debug("Depositing %s USDC to Mango UTP", ui_amount)

        self.throw_if_not_active()

        ix = await self.make_deposit_ix(ui_amount)

        tx = Transaction().add(*ix.instructions)
        sig = await self._client.program.provider.send(tx=tx, signers=ix.signers)
        logger.debug("Deposit successful: %s", sig)
        return sig

    async def make_withdraw_ix(self, ui_amount: float) -> InstructionsWrapper:
        mango_authority_pk, _ = await self.authority()

        with mango.ContextBuilder.build(
            cluster_name=self.config.cluster, group_name=self.config.group_name
        ) as context:
            mango_group = mango.Group.load(context)
            token_bank = mango_group.token_bank_by_instrument(
                USDC_TOKEN_DICT[self.config.cluster]
            )
            root_bank = token_bank.ensure_root_bank(context)
            node_bank = root_bank.pick_node_bank(context)

        root_bank_pk = root_bank.address
        node_bank_pk = node_bank.address
        vault_pk = node_bank.vault

        remaining_accounts = await self._marginfi_account.get_observation_accounts()

        ix = make_withdraw_ix(
            WithdrawArgs(amount=ui_to_native(ui_amount)),
            WithdrawAccounts(
                marginfi_account=self._marginfi_account.pubkey,
                marginfi_group=self._config.group_pk,
                signer=self._program.provider.wallet.public_key,
                margin_collateral_vault=self._marginfi_account.group.bank.vault,
                mango_authority=mango_authority_pk,
                mango_account=self.address,
                mango_program=self._config.mango.program_id,
                mango_group=self._config.mango.group_pk,
                mango_cache=mango_group.cache,
                mango_root_bank=root_bank_pk,
                mango_node_bank=node_bank_pk,
                mango_vault=vault_pk,
                mango_vault_authority=mango_group.signer_key,
            ),
            self._client.program_id,
            remaining_accounts,
        )

        return InstructionsWrapper(instructions=[ix], signers=[])

    async def withdraw(self, ui_amount: float) -> TransactionSignature:
        logger = self.get_logger()
        logger.debug("Withdrawing %s USDC from Mango UTP", ui_amount)

        ix = await self.make_withdraw_ix(ui_amount)
        transation = Transaction().add(*ix.instructions)
        sig = await self._client.program.provider.send(transation)
        logger.debug("Withdrawal successful: %s", sig)
        return sig

    async def make_place_perp_order_ix(  # pylint: disable=too-many-locals
        self,
        perp_market: mango.PerpMarket,
        side: MangoSide,
        price: float,
        quantity: float,
        options: UtpMangoPlacePerpOrderOptions = UtpMangoPlacePerpOrderOptions(),
    ) -> InstructionsWrapper:
        logger = self.get_logger()

        limit = options.limit if options.limit is not None else 20
        max_quote_quantity = options.max_quote_quantity
        client_order_id = (
            options.client_order_id if options.client_order_id is not None else 0
        )
        expiry_timestamp = options.expiry_timestamp if options.limit is not None else 0
        reduce_only = options.reduce_only if options.reduce_only is not None else False
        order_type: MangoOrderType = (
            options.order_type
            if options.order_type is not None
            else MangoOrderType.IMMEDIATE_OR_CANCEL
        )
        expiry_type: MangoExpiryType = (
            options.expiry_type
            if options.expiry_type is not None
            else MangoExpiryType.ABSOLUTE
        )

        base_decimals = float(perp_market.base.decimals)
        quote_decimals = float(perp_market.quote.decimals)

        base_factor = 10**base_decimals
        quote_factor = 10**quote_decimals

        native_price = (
            (price * quote_factor) * float(perp_market.lot_size_converter.base_lot_size)
        ) / (float(perp_market.lot_size_converter.quote_lot_size) * base_factor)
        native_quantity = (quantity * base_factor) / float(
            perp_market.lot_size_converter.base_lot_size
        )

        native_max_quote_quantity = (
            (
                max_quote_quantity
                * quote_factor
                / float(perp_market.lot_size_converter.quote_lot_size)
            )
            if max_quote_quantity is not None
            else int(mango.I64_MAX.to_integral_value())
        )

        mango_authority_pk, _ = await self.authority()

        with mango.ContextBuilder.build(
            cluster_name=self.config.cluster, group_name=self.config.group_name
        ) as context:
            mango_group = mango.Group.load(context)

        remaining_accounts = await self._marginfi_account.get_observation_accounts()

        args = PlacePerpOrderArgs(
            side=side.to_program_type(),
            price=int(native_price),
            max_base_quantity=int(native_quantity),
            max_quote_quantity=int(native_max_quote_quantity),
            client_order_id=client_order_id,
            order_type=order_type.to_program_type(),
            reduce_only=reduce_only,
            expiry_timestamp=expiry_timestamp,
            limit=limit,
            expiry_type=expiry_type.to_program_type(),
        )
        logger.debug(args)

        ix = make_place_perp_order_ix(
            args,
            PlacePerpOrderAccounts(
                marginfi_account=self._marginfi_account.pubkey,
                marginfi_group=self._marginfi_account.group.pubkey,
                signer=self._program.provider.wallet.public_key,
                mango_authority=mango_authority_pk,
                mango_account=self.address,
                mango_program=self._config.mango.program_id,
                mango_group=self._config.mango.group_pk,
                mango_cache=mango_group.cache,
                mango_perp_market=perp_market.address,
                mango_bids=perp_market.bids_address,
                mango_asks=perp_market.asks_address,
                mango_event_queue=perp_market.event_queue_address,
            ),
            self._client.program_id,
            remaining_accounts,
        )
        return InstructionsWrapper(instructions=[ix], signers=[])

    async def place_perp_order(
        self,
        perp_market: mango.PerpMarket,
        side: MangoSide,
        price: float,
        quantity: float,
        options: UtpMangoPlacePerpOrderOptions = UtpMangoPlacePerpOrderOptions(),
    ) -> TransactionSignature:
        logger = self.get_logger()
        logger.debug("Placing %s perp order on Mango UTP", perp_market.symbol)

        self.throw_if_not_active()

        ix = await self.make_place_perp_order_ix(
            perp_market, side, price, quantity, options
        )
        transation = Transaction().add(*ix.instructions)
        sig = await self._client.program.provider.send(transation)
        logger.debug("Place order successful: %s", sig)
        return sig

    async def make_cancel_perp_order_ix(
        self, perp_market: mango.PerpMarket, order_id: int, invalid_id_ok: bool
    ) -> InstructionsWrapper:
        mango_authority_pk, _ = await self.authority()
        remaining_accounts = await self._marginfi_account.get_observation_accounts()

        ix = make_cancel_perp_order_ix(
            CancelPerpOrderArgs(
                order_id=order_id,
                invalid_id_ok=invalid_id_ok,
            ),
            CancelPerpOrderAccounts(
                marginfi_account=self._marginfi_account.pubkey,
                marginfi_group=self._marginfi_account.group.pubkey,
                signer=self._program.provider.wallet.public_key,
                mango_authority=mango_authority_pk,
                mango_account=self.address,
                mango_program=self._config.mango.program_id,
                mango_group=self._config.mango.group_pk,
                mango_perp_market=perp_market.address,
                mango_bids=perp_market.bids_address,
                mango_asks=perp_market.asks_address,
            ),
            self._client.program_id,
            remaining_accounts,
        )
        return InstructionsWrapper(instructions=[ix], signers=[])

    async def cancel_perp_order(
        self,
        perp_market: mango.PerpMarket,
        order_id: int,
        invalid_id_ok: bool,
    ) -> TransactionSignature:
        logger = self.get_logger()
        logger.debug("Canceling %s perp order on Mango UTP", perp_market.symbol)

        self.throw_if_not_active()

        ix = await self.make_cancel_perp_order_ix(
            perp_market,
            order_id,
            invalid_id_ok,
        )
        transation = Transaction().add(*ix.instructions)
        sig = await self._client.program.provider.send(transation)
        logger.debug("Cancel order successful: %s", sig)
        return sig

    async def compute_mango_account_address(self, account_number: int = 0):
        """
        [internal]
        """
        utp_authority_pk, _ = await self.authority()

        mango_account_pk, _ = get_mango_account_pda(
            self._config.mango.group_pk,
            utp_authority_pk,
            account_number,
            self._config.mango.program_id,
        )
        return mango_account_pk

    async def get_observation_accounts(self) -> List[AccountMeta]:
        """
        Creates list of account metas required to observe a Mango account.
        """

        with mango.ContextBuilder.build(
            cluster_name=self.config.cluster, group_name=self.config.group_name
        ) as context:
            mango_group = mango.Group.load(context)
        return [
            AccountMeta(
                pubkey=self.address,
                is_signer=False,
                is_writable=False,
            ),
            AccountMeta(
                pubkey=self.config.group_pk,
                is_signer=False,
                is_writable=False,
            ),
            AccountMeta(
                pubkey=mango_group.cache,
                is_signer=False,
                is_writable=False,
            ),
        ]

    async def observe(self) -> UtpObservation:
        """
        Retrieves the Mango observation directly from the Mango accounts and refreshes the cache.
        """

        pubkeys = [m.pubkey for m in await self.get_observation_accounts()]

        response: RPCResponse = await self._program.provider.connection.get_multiple_accounts(
            pubkeys  # type: ignore
        )
        if "error" in response.keys():
            raise Exception(f"Error while fetching {pubkeys}: {response['error']}")
        [mango_account_json, mango_group_json, mango_cache_json] = response["result"][
            "value"
        ]
        if mango_account_json is None:
            raise Exception(f"Mango account {pubkeys[0]} not found")
        if mango_group_json is None:
            raise Exception(f"Mango group {pubkeys[1]} not found")
        if mango_cache_json is None:
            raise Exception(f"Mango cache {pubkeys[2]} not found")

        mango_account_data = b64str_to_bytes(json_to_account_info(mango_account_json).data[0])  # type: ignore
        mango_group_data = b64str_to_bytes(json_to_account_info(mango_group_json).data[0])  # type: ignore
        mango_cache_data = b64str_to_bytes(json_to_account_info(mango_cache_json).data[0])  # type: ignore

        observation = utp_observation.mango.get_observation(
            mango_account_data=mango_account_data,
            mango_group_data=mango_group_data,
            mango_cache_data=mango_cache_data,
        )

        self._cached_observation = UtpObservation.from_raw(observation)

        return UtpObservation(
            timestamp=datetime.fromtimestamp(observation.timestamp),
            equity=observation.equity,
            free_collateral=observation.free_collateral,
            is_empty=observation.is_empty,
            is_rebalance_deposit_needed=observation.is_rebalance_deposit_valid,
            liquidation_value=observation.liquidation_value,
            max_rebalance_deposit_amount=observation.max_rebalance_deposit_amount,
            init_margin_requirement=observation.init_margin_requirement,
        )

    def get_logger(self):
        return get_logger(f"{__name__}.UtpMangoAccount.{self.address}")


def get_mango_account_pda(
    mango_group_pk: PublicKey,
    authority: PublicKey,
    account_number: int,
    program_id: PublicKey,
) -> Tuple[PublicKey, int]:
    """
    [internal] Computes the Mango account PDA tied to the specified user.
    """

    return PublicKey.find_program_address(
        [
            bytes(mango_group_pk),
            bytes(authority),
            account_number.to_bytes(8, "little"),
        ],
        program_id,
    )
