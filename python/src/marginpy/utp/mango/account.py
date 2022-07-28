from __future__ import annotations

from typing import Tuple, List

import mango
from marginpy.generated_client.types.mango_expiry_type import (
    Absolute,
    MangoExpiryTypeKind,
)
from marginpy.generated_client.types.mango_order_type import (
    ImmediateOrCancel,
    MangoOrderTypeKind,
)
from marginpy.generated_client.types.utp_mango_place_perp_order_args import (
    UtpMangoPlacePerpOrderArgs,
)
from marginpy.types import (
    UtpData,
    UtpMangoPlacePerpOrderOptions,
)
from solana.transaction import (
    AccountMeta,
    TransactionInstruction,
    Transaction,
    TransactionSignature,
)
from solana.publickey import PublicKey
from solana.keypair import Keypair
from marginpy.utils import get_bank_authority, ui_to_native
from marginpy.utp.account import UtpAccount
from marginpy.utp.mango.instruction import (
    make_activate_ix,
    ActivateArgs,
    ActivateAccounts,
    make_deposit_ix,
    DepositArgs,
    DepositAccounts,
    make_withdraw_ix,
    WithdrawArgs,
    WithdrawAccounts,
    make_place_perp_order_ix,
    PlacePerpOrderArgs,
    PlacePerpOrderAccounts,
    make_cancel_perp_order_ix,
    CancelPerpOrderArgs,
    CancelPerpOrderAccounts,
)
from marginpy.utp.mango.types import USDC_TOKEN_DICT
import marginpy.generated_client.types as gen_types

from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from marginpy import MarginfiClient, MarginfiAccount


class UtpMangoAccount(UtpAccount):
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
        return self._config.mango

    # --- Others

    async def make_activate_ix(self) -> TransactionInstruction:
        """
        Create transaction instruction to activate Mango.

        :returns: `ActivateUtp` transaction instruction
        """

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

        return make_activate_ix(
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

    async def activate(self) -> TransactionSignature:
        """
        Activate Mango.

        :returns: Transaction signature
        """

        activate_ix = await self.make_activate_ix()
        tx = Transaction().add(activate_ix)
        sig = await self._client.program.provider.send(tx)
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
        :returns `MangoDepositCollateral` transaction instruction
        """

        proxy_token_account_key = Keypair()

        mango_authority_pk, _ = await self.authority()
        margin_bank_authority_pk, _ = get_bank_authority(
            self._config.group_pk, self._program.program_id
        )

        with mango.ContextBuilder.build(
            cluster_name=self.config.cluster,
            group_name="devnet.2",  # TODO update for mainnet
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

        remaining_accounts = await self.get_observation_accounts()

        create_proxy_token_account_ixs = await self.make_create_proxy_token_account_ixs(
            proxy_token_account_key.public_key,
            mango_authority_pk,
        )

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
                    remaining_accounts=remaining_accounts,
                ),
            ],
            proxy_token_account_key,
        )

    async def deposit(self, amount: float) -> TransactionSignature:
        """
        Deposit collateral into the Mango account.

        :param amount Amount to deposit (mint native unit)
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
        Create transaction instruction to withdraw from the Mango account to the marginfi account.

        :param amount Amount to deposit (mint native unit)
        :returns: `MangoWithdrawCollateral` transaction instruction
        """

        mango_authority_pk, _ = await self.authority()

        with mango.ContextBuilder.build(
            cluster_name=self.config.cluster, group_name="devnet.2"
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

        remaining_accounts = await self.get_observation_accounts()

        return make_withdraw_ix(
            WithdrawArgs(amount=ui_to_native(amount)),
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

    async def withdraw(self, amount: float) -> TransactionSignature:
        """
        Withdraw from the Mango account to the marginfi account.

        :param amount Amount to deposit (mint native unit)
        :returns: Transaction signature
        """

        withdraw_ix = await self.make_withdraw_ix(amount)
        tx = Transaction().add(withdraw_ix)
        return await self._client.program.provider.send(tx)

    async def get_observation_accounts(self) -> List[AccountMeta]:
        """
        Create list of account metas required to observe a Mango account.

        :returns: `AccountMeta[]` list of account metas
        """

        with mango.ContextBuilder.build(
            cluster_name=self.config.cluster, group_name="devnet.2"
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

    async def make_place_perp_order_ix(
        self,
        perp_market: mango.PerpMarket,
        side: gen_types.MangoSideKind,
        price: float,
        quantity: float,
        options: UtpMangoPlacePerpOrderOptions = UtpMangoPlacePerpOrderOptions(),
    ) -> TransactionInstruction:
        """
        Create transaction instruction to place a perp order.

        :returns: `MangoPlacePerpOrder` transaction instruction
        """

        limit = options.limit if options.limit is not None else 20
        max_quote_quantity = options.max_quote_quantity or float(mango.I64_MAX)
        client_order_id = (
            options.client_order_id if options.client_order_id is not None else 0
        )
        expiry_timestamp = options.expiry_timestamp if options.limit is not None else 0
        reduce_only = options.reduce_only if options.reduce_only is not None else False
        order_type: MangoOrderTypeKind = (
            options.order_type
            if options.order_type is not None
            else ImmediateOrCancel()
        )
        expiry_type: MangoExpiryTypeKind = (
            options.expiry_type if options.expiry_type is not None else Absolute()
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
                max_quote_quantity * quote_factor / 10000000000000000
            )  # TODO Figure out out_of_range problem here
            / float(perp_market.lot_size_converter.quote_lot_size)
        ) or float(mango.I64_MAX)

        mango_authority_pk, _ = await self.authority()

        with mango.ContextBuilder.build(
            cluster_name=self.config.cluster, group_name="devnet.2"
        ) as context:
            mango_group = mango.Group.load(context)

        remaining_accounts = await self.get_observation_accounts()

        return make_place_perp_order_ix(
            PlacePerpOrderArgs(
                args=UtpMangoPlacePerpOrderArgs(
                    side=side,
                    price=int(native_price),
                    max_base_quantity=int(native_quantity),
                    max_quote_quantity=int(native_max_quote_quantity),
                    client_order_id=client_order_id,
                    order_type=order_type,
                    reduce_only=reduce_only,
                    expiry_timestamp=expiry_timestamp,
                    limit=limit,
                    expiry_type=expiry_type,
                )
            ),
            PlacePerpOrderAccounts(
                marginfi_account=self._marginfi_account.pubkey,
                marginfi_group=self._marginfi_account.group.pubkey,
                authority=self._program.provider.wallet.public_key,
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

    async def place_perp_order(
        self,
        perp_market: mango.PerpMarket,
        side: gen_types.MangoSideKind,
        price: float,
        quantity: float,
        options: UtpMangoPlacePerpOrderOptions = UtpMangoPlacePerpOrderOptions(),
    ) -> TransactionSignature:
        """
        Place a perp order.

        :returns: Transaction signature
        """
        self.verify_active()

        place_perp_order_ix = await self.make_place_perp_order_ix(
            perp_market, side, price, quantity, options
        )
        tx = Transaction().add(place_perp_order_ix)
        return await self._client.program.provider.send(tx)

    async def make_cancel_perp_order_ix(
        self, perp_market: mango.PerpMarket, order_id: int, invalid_id_ok: bool
    ) -> TransactionInstruction:
        """
        Create transaction instruction to cancel a perp order.

        :returns: `MangoCancelPerpOrder` transaction instruction
        """

        mango_authority_pk, _ = await self.authority()
        remaining_accounts = await self.get_observation_accounts()

        return make_cancel_perp_order_ix(
            CancelPerpOrderArgs(
                order_id=order_id,
                invalid_id_ok=invalid_id_ok,
            ),
            CancelPerpOrderAccounts(
                marginfi_account=self._marginfi_account.pubkey,
                marginfi_group=self._marginfi_account.group.pubkey,
                authority=self._program.provider.wallet.public_key,
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

    async def cancel_perp_order(
        self,
        perp_market: mango.PerpMarket,
        order_id: int,
        invalid_id_ok: bool,
    ) -> TransactionSignature:
        """
        Cancel a perp order.

        :returns: Transaction signature
        """

        self.verify_active()

        cancel_perp_order_ix = await self.make_cancel_perp_order_ix(
            perp_market,
            order_id,
            invalid_id_ok,
        )
        tx = Transaction().add(cancel_perp_order_ix)
        return await self._client.program.provider.send(tx)

    async def compute_utp_account_address(self, account_number: int = 0):
        """[Internal]"""
        utp_authority_pk, _ = await self.authority()
        utp_account_pk, _ = get_mango_account_pda(
            self._config.mango.group_pk,
            utp_authority_pk,
            account_number,
            self._config.mango.program_id,
        )
        return utp_account_pk

    # @todo
    async def observe(self):
        """
        Refresh and retrieve the health cache for the Mango account, directly from the mango account.

        :returns: Health cache for the Mango UTP
        """
        pass


def get_mango_account_pda(
    mango_group_pk: PublicKey,
    authority: PublicKey,
    account_number: int,
    program_id: PublicKey,
) -> Tuple[PublicKey, int]:
    """[Internal] Compute the Mango account PDA tied to the specified user."""

    return PublicKey.find_program_address(
        [
            bytes(mango_group_pk),
            bytes(authority),
            account_number.to_bytes(8, "little"),
        ],
        program_id,
    )
