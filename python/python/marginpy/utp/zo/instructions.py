from dataclasses import dataclass
from typing import List

import marginpy.generated_client.instructions as gen_ix
from marginpy.generated_client.instructions.utp_zo_cancel_perp_order import HeaderNested
from marginpy.generated_client.types.utp_zo_place_perp_order_ix_args import (
    UtpZoPlacePerpOrderIxArgs,
)
from solana.publickey import PublicKey
from solana.system_program import SYS_PROGRAM_ID
from solana.sysvar import SYSVAR_RENT_PUBKEY
from solana.transaction import AccountMeta, TransactionInstruction
from spl.token.constants import TOKEN_PROGRAM_ID

# --- Activate


class ActivateArgs(gen_ix.UtpZoActivateArgs):
    pass


@dataclass
class ActivateAccounts:
    marginfi_account: PublicKey
    marginfi_group: PublicKey
    authority: PublicKey
    utp_authority: PublicKey
    zo_program: PublicKey
    zo_state: PublicKey
    zo_margin: PublicKey
    zo_control: PublicKey


def make_activate_ix(
    args: gen_ix.UtpZoActivateArgs,
    accounts: ActivateAccounts,
    program_id: PublicKey,
) -> TransactionInstruction:
    return gen_ix.utp_zo_activate(
        args,
        gen_ix.UtpZoActivateAccounts(
            marginfi_account=accounts.marginfi_account,
            marginfi_group=accounts.marginfi_group,
            authority=accounts.authority,
            utp_authority=accounts.utp_authority,
            zo_program=accounts.zo_program,
            zo_state=accounts.zo_state,
            zo_margin=accounts.zo_margin,
            zo_control=accounts.zo_control,
            rent=SYSVAR_RENT_PUBKEY,
            system_program=SYS_PROGRAM_ID,
        ),
        program_id=program_id,
    )


# --- Deposit


class DepositArgs(gen_ix.UtpZoDepositArgs):
    pass


@dataclass
class DepositAccounts:
    marginfi_account: PublicKey
    marginfi_group: PublicKey
    signer: PublicKey
    margin_collateral_vault: PublicKey
    bank_authority: PublicKey
    temp_collateral_account: PublicKey
    utp_authority: PublicKey
    zo_program: PublicKey
    zo_state: PublicKey
    zo_state_signer: PublicKey
    zo_cache: PublicKey
    zo_margin: PublicKey
    zo_vault: PublicKey


def make_deposit_ix(
    args: gen_ix.UtpZoDepositArgs,
    accounts: DepositAccounts,
    program_id: PublicKey,
    remaining_accounts: List[AccountMeta],
) -> TransactionInstruction:
    return gen_ix.utp_zo_deposit(
        args,
        accounts=gen_ix.UtpZoDepositAccounts(
            marginfi_account=accounts.marginfi_account,
            marginfi_group=accounts.marginfi_group,
            signer=accounts.signer,
            margin_collateral_vault=accounts.margin_collateral_vault,
            bank_authority=accounts.bank_authority,
            temp_collateral_account=accounts.temp_collateral_account,
            utp_authority=accounts.utp_authority,
            zo_program=accounts.zo_program,
            zo_state=accounts.zo_state,
            zo_state_signer=accounts.zo_state_signer,
            zo_cache=accounts.zo_cache,
            zo_margin=accounts.zo_margin,
            zo_vault=accounts.zo_vault,
            rent=SYSVAR_RENT_PUBKEY,
            token_program=TOKEN_PROGRAM_ID,
            system_program=SYS_PROGRAM_ID,
        ),
        program_id=program_id,
        remaining_accounts=remaining_accounts,
    )


# --- Withdraw


class WithdrawArgs(gen_ix.UtpZoWithdrawArgs):
    pass


@dataclass
class WithdrawAccounts:
    marginfi_account: PublicKey
    marginfi_group: PublicKey
    signer: PublicKey
    margin_collateral_vault: PublicKey
    utp_authority: PublicKey
    zo_margin: PublicKey
    zo_program: PublicKey
    zo_state: PublicKey
    zo_state_signer: PublicKey
    zo_cache: PublicKey
    zo_control: PublicKey
    zo_vault: PublicKey
    zo_heimdall: PublicKey


def make_withdraw_ix(
    args: gen_ix.UtpZoWithdrawArgs,
    accounts: WithdrawAccounts,
    program_id: PublicKey,
    remaining_accounts: List[AccountMeta],
) -> TransactionInstruction:
    return gen_ix.utp_zo_withdraw(
        args,
        accounts=gen_ix.UtpZoWithdrawAccounts(
            marginfi_account=accounts.marginfi_account,
            marginfi_group=accounts.marginfi_group,
            signer=accounts.signer,
            margin_collateral_vault=accounts.margin_collateral_vault,
            utp_authority=accounts.utp_authority,
            zo_margin=accounts.zo_margin,
            zo_program=accounts.zo_program,
            zo_state=accounts.zo_state,
            zo_state_signer=accounts.zo_state_signer,
            zo_cache=accounts.zo_cache,
            zo_control=accounts.zo_control,
            zo_vault=accounts.zo_vault,
            heimdall=accounts.zo_heimdall,
            token_program=TOKEN_PROGRAM_ID,
        ),
        program_id=program_id,
        remaining_accounts=remaining_accounts,
    )


# --- Place order


class PlacePerpOrderArgs(UtpZoPlacePerpOrderIxArgs):
    def __str__(self):
        return f"""
is_long: {self.is_long},
order_type: {self.order_type},
limit: {self.limit},
limit_price: {self.limit_price},
client_id: {self.client_id},
max_base_quantity: {self.max_base_quantity},
max_quote_quantity: {self.max_quote_quantity},
        """


@dataclass
class PlacePerpOrderAccounts:
    marginfi_account: PublicKey
    marginfi_group: PublicKey
    signer: PublicKey
    utp_authority: PublicKey
    zo_program: PublicKey
    state: PublicKey
    state_signer: PublicKey
    cache: PublicKey
    margin: PublicKey
    control: PublicKey
    open_orders: PublicKey
    dex_market: PublicKey
    req_q: PublicKey
    event_q: PublicKey
    market_bids: PublicKey
    market_asks: PublicKey
    dex_program: PublicKey


def make_place_perp_order_ix(
    args: PlacePerpOrderArgs,
    accounts: PlacePerpOrderAccounts,
    program_id: PublicKey,
    remaining_accounts: List[AccountMeta],
) -> TransactionInstruction:
    return gen_ix.utp_zo_place_perp_order(
        gen_ix.UtpZoPlacePerpOrderArgs(args=args),
        accounts=gen_ix.UtpZoPlacePerpOrderAccounts(
            header=HeaderNested(
                marginfi_account=accounts.marginfi_account,
                marginfi_group=accounts.marginfi_group,
                signer=accounts.signer,
                utp_authority=accounts.utp_authority,
            ),
            zo_program=accounts.zo_program,
            state=accounts.state,
            state_signer=accounts.state_signer,
            cache=accounts.cache,
            margin=accounts.margin,
            control=accounts.control,
            open_orders=accounts.open_orders,
            dex_market=accounts.dex_market,
            req_q=accounts.req_q,
            event_q=accounts.event_q,
            market_bids=accounts.market_bids,
            market_asks=accounts.market_asks,
            dex_program=accounts.dex_program,
            rent=SYSVAR_RENT_PUBKEY,
        ),
        program_id=program_id,
        remaining_accounts=remaining_accounts,
    )


# --- Cancel order


class CancelPerpOrderArgs(gen_ix.UtpZoCancelPerpOrderArgs):
    pass


@dataclass
class CancelPerpOrderAccounts:
    marginfi_account: PublicKey
    marginfi_group: PublicKey
    signer: PublicKey
    utp_authority: PublicKey
    zo_program: PublicKey
    state: PublicKey
    cache: PublicKey
    margin: PublicKey
    control: PublicKey
    open_orders: PublicKey
    dex_market: PublicKey
    market_bids: PublicKey
    market_asks: PublicKey
    event_q: PublicKey
    dex_program: PublicKey


def make_cancel_perp_order_ix(
    args: gen_ix.UtpZoCancelPerpOrderArgs,
    accounts: CancelPerpOrderAccounts,
    program_id: PublicKey,
    remaining_accounts: List[AccountMeta],
) -> TransactionInstruction:
    return gen_ix.utp_zo_cancel_perp_order(
        args,
        accounts=gen_ix.UtpZoCancelPerpOrderAccounts(
            header=HeaderNested(
                marginfi_account=accounts.marginfi_account,
                marginfi_group=accounts.marginfi_group,
                signer=accounts.signer,
                utp_authority=accounts.utp_authority,
            ),
            zo_program=accounts.zo_program,
            state=accounts.state,
            cache=accounts.cache,
            margin=accounts.margin,
            control=accounts.control,
            open_orders=accounts.open_orders,
            dex_market=accounts.dex_market,
            market_bids=accounts.market_bids,
            market_asks=accounts.market_asks,
            event_q=accounts.event_q,
            dex_program=accounts.dex_program,
        ),
        program_id=program_id,
        remaining_accounts=remaining_accounts,
    )


# --- Create perp order


@dataclass
class CreatePerpOpenOrdersAccounts:
    marginfi_account: PublicKey
    marginfi_group: PublicKey
    signer: PublicKey
    utp_authority: PublicKey
    zo_program: PublicKey
    state: PublicKey
    state_signer: PublicKey
    margin: PublicKey
    control: PublicKey
    open_orders: PublicKey
    dex_market: PublicKey
    dex_program: PublicKey


def make_create_perp_open_orders_ix(
    accounts: CreatePerpOpenOrdersAccounts,
    program_id: PublicKey,
) -> TransactionInstruction:
    return gen_ix.utp_zo_create_perp_open_orders(
        accounts=gen_ix.UtpZoCreatePerpOpenOrdersAccounts(
            header=HeaderNested(
                marginfi_account=accounts.marginfi_account,
                marginfi_group=accounts.marginfi_group,
                signer=accounts.signer,
                utp_authority=accounts.utp_authority,
            ),
            zo_program=accounts.zo_program,
            state=accounts.state,
            state_signer=accounts.state_signer,
            margin=accounts.margin,
            control=accounts.control,
            open_orders=accounts.open_orders,
            dex_market=accounts.dex_market,
            dex_program=accounts.dex_program,
            rent=SYSVAR_RENT_PUBKEY,
            system_program=SYS_PROGRAM_ID,
        ),
        program_id=program_id,
    )


# --- Settle funds


@dataclass
class SettleFundsAccounts:
    marginfi_account: PublicKey
    marginfi_group: PublicKey
    signer: PublicKey
    utp_authority: PublicKey
    zo_program: PublicKey
    state: PublicKey
    state_signer: PublicKey
    cache: PublicKey
    margin: PublicKey
    control: PublicKey
    open_orders: PublicKey
    dex_market: PublicKey
    dex_program: PublicKey


def make_settle_funds_ix(
    accounts: SettleFundsAccounts,
    program_id: PublicKey,
) -> TransactionInstruction:
    return gen_ix.utp_zo_settle_funds(
        accounts=gen_ix.UtpZoSettleFundsAccounts(
            header=HeaderNested(
                marginfi_account=accounts.marginfi_account,
                marginfi_group=accounts.marginfi_group,
                signer=accounts.signer,
                utp_authority=accounts.utp_authority,
            ),
            zo_program=accounts.zo_program,
            state=accounts.state,
            state_signer=accounts.state_signer,
            cache=accounts.cache,
            margin=accounts.margin,
            control=accounts.control,
            open_orders=accounts.open_orders,
            dex_market=accounts.dex_market,
            dex_program=accounts.dex_program,
        ),
        program_id=program_id,
    )
