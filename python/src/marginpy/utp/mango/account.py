from typing import Tuple, List, Optional
from marginpy import MarginfiClient, MarginfiAccount
from marginpy.utp.account import UtpAccount
from marginpy.types import UtpData, AccountConfig, UtpMangoPlacePerpOrderOptions, MangoPerpOrderType, ExpiryType
from solana.transaction import (
    AccountMeta,
    TransactionInstruction,
    Transaction,
    TransactionSignature,
)
from solana.rpc.commitment import Commitment
from solana.publickey import PublicKey
from solana.keypair import Keypair
from solana.system_program import create_account, CreateAccountParams
from spl.token.constants import TOKEN_PROGRAM_ID
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
from marginpy.utils import (
    get_bank_authority,
    ui_to_native
)
from mango import (
    PerpMarket,
)
from solana.token.instructions import initialize_account, InitializeAccountParams
import marginpy.generated_client.types as gen_types


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
        self._client = client
        self._marginfi_account = marginfi_account
        self.is_active = account_data.is_active
        self.account_config = account_data.account_config

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
        mango_authority_pk, mango_authority_bump = await self.authority(authority_seed.public_key)
        mango_account_pk, _ = get_mango_account_pda(
            self._config.mango.group_config.pubkey,
            mango_authority_pk,
            0,
            self._config.mango.program_id,
        )

        return make_activate_ix(
            ActivateArgs(
                authority_seed=authority_seed.public_key,
                authority_bump=mango_authority_bump,
            ),
            ActivateAccounts(
                marginfi_account=self._marginfi_account.pubkey,
                marginfi_group=self._config.group_pk,
                authority=self._program.provider.wallet.public_key,
                mango_authority=mango_authority_pk,
                mango_account=mango_account_pk,
                mango_program=self._config.mango.program_id,
                mango_group=self._config.mango.group_config.public_key,
            ),
            self._client.program_id,
        )

    async def activate(self) -> TransactionSignature:
        """
        Activate Mango.
        
        :returns: Transaction signature
        """

        activate_ix = await self.activate_ix()
        tx = Transaction().add(activate_ix)
        sig = await self._client.program.provider.send(tx)
        await self._marginfi_account.reload()
        return sig

    # FINISH
    # @todo check deactivate fns
    async def make_deactivate_ix(self) -> TransactionInstruction:
        """
        Create transaction instruction to deactivate Mango.
        
        :returns: `DeactivateUtp` transaction instruction
        """
        return self._marginfi_account.make_deactivate_utp_ix(self.index)

    # FINISH
    async def deactivate(self) -> TransactionSignature:
        """
        Deactivate UTP.
        
        :returns: Transaction signature
        """
        self.verify_active()

        sig = await self._marginfi_account.deactivate_utp(self.index)
        await self._marginfi_account.reload()
        return sig

    async def make_create_proxy_token_account_ix(self, proxy_token_account_key_pk) -> TransactionInstruction:        

        return create_account(
            CreateAccountParams(
                from_pubkey=self._program.provider.wallet.public_key,
                new_account_pubkey=proxy_token_account_key_pk,
                lamports=await self._program.provider.connection.get_minimum_balance_for_rent_exemption(AccountLayout.span),
                space=AccountLayout.span,
                program_id=TOKEN_PROGRAM_ID
            )
        )

    def make_init_proxy_token_account_ix(self, proxy_token_account_key_pk, mango_authority_pk) -> TransactionInstruction:

        return initialize_account(
            InitializeAccountParams(
                program_id=TOKEN_PROGRAM_ID,
                mint=self._marginfi_account.group.bank.mint,
                account=proxy_token_account_key_pk,
                owner=mango_authority_pk,
            )
        )

    async def make_deposit_ix(self, amount: float) -> TransactionInstruction:
        """
        Create transaction instruction to deposit collateral into the Mango account.
        
        :param amount Amount to deposit (mint native unit)
        :returns `MangoDepositCollateral` transaction instruction
        """
        proxy_token_account_key = Keypair()
        
        mango_authority_pk = await self.authority()
        margin_bank_authority_pk = await get_bank_authority(self._config.group_pk, self._program.program_id)
        mango_group = await self.get_mango_group()

        root_bank_pk = mango_group.root_bank_pk
        node_bank_pk = mango_group.first_node_bank_pk
        vault_pk = mango_group.first_node_bank_vault_pk

        remaining_accounts = self.get_observation_accounts()

        make_create_proxy_token_account_ix = self.make_create_proxy_token_account_ix(proxy_token_account_key.public_key)
        make_init_proxy_token_account_ix = self.make_init_proxy_token_account_ix(
            proxy_token_account_key.public_key,
            mango_authority_pk,
        )

        return [
            make_create_proxy_token_account_ix,
            make_init_proxy_token_account_ix,
            make_deposit_ix(
                args=DepositArgs(ui_to_native(amount)),
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
                    mango_group=self._config.mango.group_config.public_key,
                    mango_cache=mango_group.cache,
                    mango_root_bank=root_bank_pk,
                    mango_node_bank=node_bank_pk,
                    mango_vault=vault_pk,
                ),
                program_id=self._client.program_id,
                remaining_accounts=remaining_accounts,
            ),
        ]

    async def deposit(self, amount: float) -> TransactionSignature:
        """
        Deposit collateral into the Mango account.
        
        :param amount Amount to deposit (mint native unit)
        :returns" Transaction signature
        """

        self.verify_active()

        deposit_ix = await self.make_deposit_ix(amount)
        tx = Transaction().add(deposit_ix)
        return await self._client.program.provider.send(tx)

    async def make_withdraw_ix(self, amount: float) -> TransactionInstruction:
        """
        Create transaction instruction to withdraw from the Mango account to the marginfi account.
        
        :param amount Amount to deposit (mint native unit)
        :returns: `MangoWithdrawCollateral` transaction instruction
        """

        mango_authority_pk = await self.authority()
        
        mango_group = await self.get_mango_group()

        root_bank_pk = mango_group.root_bank_pk
        node_bank_pk = mango_group.first_node_bank_pk
        vault_pk = mango_group.first_node_bank_vault_pk
        
        remaining_accounts = self.get_observation_accounts()

        return make_withdraw_ix(
            WithdrawArgs(ui_to_native(amount)),
            WithdrawAccounts(
                marginfi_account=self._marginfi_account.pubkey,
                marginfi_group=self._config.group_pk,
                signer=self._program.provider.wallet.public_key,
                margin_collateral_vault=self._marginfi_account.group.bank.vault,
                mango_authority=mango_authority_pk,
                mango_account=self.address,
                mango_program=self._config.mango.program_id,
                mango_group=self._config.mango.group_config.public_key,
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
        mango_group = await self.get_mango_group()
        return [
            AccountMeta(
                pubkey=self.address,
                is_signer=False,
                is_writable=False,
            ),
            AccountMeta(
                pubkey=self._config.mango.group_config.public_key,
                is_signer=False,
                is_writable=False,
            ),
            AccountMeta(
                pubkey=mango_group.cache,
                is_signer=False,
                is_writable=False,
            )
        ]

    # FINISH
    async def make_place_perp_order_ix(
        self,
        perp_market: PerpMarket,
        side: gen_types.MangoSideKind,
        price: int,
        quantity: float,
        options: UtpMangoPlacePerpOrderOptions = None,
    ) -> TransactionInstruction:
        """
        Create transaction instruction to place a perp order.
        
        :returns: `MangoPlacePerpOrder` transaction instruction
        """
        if options is None:
            options = {}
        
        mango_group = await self.get_mango_group()       
        remaining_accounts = self.get_observation_accounts()

        return make_place_perp_order_ix(
            PlacePerpOrderArgs(
                side=side,
                price=int,
                max_base_quantity
                max_quote_quantity=options.max_quote_quantity,
                client_order_id=options.client_order_id | 0,
                order_type=options.order_type,
                reduce_only = options.reduce_only,
                expiry_timestamp = options.expiry_timestamp | 0,
                limit = options.limit | 20,
                expiry_type = options.expiry_type | gen_types.ExpiryType.Absolute
            ),
            PlacePerpOrderAccounts(
                marginfi_account=self._marginfi_account.pubkey,
                marginfi_group=self._marginfi_account.group.pubkey,
                authority=self._program.provider.wallet.public_key,
                mango_authority=mango_authority_pk,
                mango_account=self.address,
                mango_program=self._config.mango.program_id,
                mango_group=self._config.mango.group_config.public_key,
                mango_cache=mango_group.cache,
                mango_perp_market=perp_market.public_key,
                mango_bids=perp_market.bids_address
                mango_asks=perp_market.asks_address
                mango_event_queue=perp_market.event_queue_address,
            ),
            self._client.program_id,
            remaining_accounts,
        )

    async def place_perp_order(
        self,
        perp_market: PerpMarket,
        side: gen_types.MangoSideKind,
        price: int,
        quantity: float,
        options: UtpMangoPlacePerpOrderOptions = None,
    ) -> TransactionSignature:
        """
        Place a perp order.
        
        :returns: Transaction signature
        """
        self.verify_active()

        place_perp_order_ix = await self.make_place_perp_order_ix(
            perp_market,
            side,
            price,
            quantity,
            options
        )
        tx = Transaction().add(place_perp_order_ix)
        return await self._client.program.provider.send(tx)

    async def make_cancel_perp_order_ix(
        self,
        market: PerpMarket,
        order_id: int,
        invalid_id_ok: bool
    ) -> TransactionInstruction:
        """
        Create transaction instruction to cancel a perp order.
        
        :returns: `MangoCancelPerpOrder` transaction instruction
        """

        mango_authority_pk = await self.authority()
        remaining_accounts = self.get_observation_accounts()

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
                mango_group=self._config.mango.group_config.pubkey,
                mango_perp_market=market.address,
                mango_bids=market.bids_address,
                mango_asks=market.asks_address,
            ),
            self._client.program_id,
            remaining_accounts,
        )

    async def cancel_perp_order(
        self,
        perp_market: PerpMarket,
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

    def verify_active(self):
        """[Internal]"""
        if not self.is_active:
            raise Exception("Utp isn't active")

    async def compute_utp_account_address(self, account_number: int = 0):
        """[Internal]"""
        utp_authority_pk = await self.authority()
        utp_account_pk, _ = await get_mango_account_pda(
            self._config.mango.group_config.public_key,
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

    # def get_mango_client(self):
    #     return self.mango_context.client

    # async def get_mango_account(self, mango_group: MangoGroup):
        
    #     if not mango_group:
    #         mango_group = await self.get_mango_group()

    #     return MangoAccount.load(self.mango_context, self.address, mango_group)

    async def get_mango_group(self) -> MangoGroup:
        return await MangoGroup.fetch(
            self._program.provider.connection,
            self._config.mango.group_config.public_key,
            self._config.collateral_mint_pk
        )


async def get_mango_account_pda(
    mango_group_pk: PublicKey,
    authority: PublicKey,
    account_number: int,
    program_id: PublicKey
) -> Tuple[PublicKey, int]:
    """[Internal] Compute the Mango account PDA tied to the specified user."""

    return PublicKey.find_program_address(
        [
            bytes(mango_group_pk),
            bytes(authority),
            b"\x01" + account_number.to_bytes(8, "little")
        ],
        program_id
    )
