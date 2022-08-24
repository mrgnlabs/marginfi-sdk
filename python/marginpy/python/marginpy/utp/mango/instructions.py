from dataclasses import dataclass
from typing import List

import marginpy.generated_client.instructions as gen_ix
from marginpy.generated_client.types.utp_mango_place_perp_order_args import (
    UtpMangoPlacePerpOrderArgs,
)
from solana.publickey import PublicKey
from solana.system_program import SYS_PROGRAM_ID
from solana.transaction import AccountMeta, TransactionInstruction
from spl.token.constants import TOKEN_PROGRAM_ID

# --- Activate


class ActivateArgs(gen_ix.UtpMangoActivateArgs):
    pass


@dataclass
class ActivateAccounts:
    marginfi_account: PublicKey
    marginfi_group: PublicKey
    authority: PublicKey
    mango_authority: PublicKey
    mango_account: PublicKey
    mango_program: PublicKey
    mango_group: PublicKey


def make_activate_ix(
    args: gen_ix.UtpMangoActivateArgs,
    accounts: ActivateAccounts,
    program_id: PublicKey,
) -> TransactionInstruction:
    return gen_ix.utp_mango_activate(
        args,
        gen_ix.UtpMangoActivateAccounts(
            marginfi_account=accounts.marginfi_account,
            marginfi_group=accounts.marginfi_group,
            authority=accounts.authority,
            mango_authority=accounts.mango_authority,
            mango_account=accounts.mango_account,
            mango_program=accounts.mango_program,
            mango_group=accounts.mango_group,
            system_program=SYS_PROGRAM_ID,
        ),
        program_id=program_id,
    )


# --- Deposit


class DepositArgs(gen_ix.UtpMangoDepositArgs):
    pass


@dataclass
class DepositAccounts:
    marginfi_account: PublicKey
    marginfi_group: PublicKey
    signer: PublicKey
    margin_collateral_vault: PublicKey
    bank_authority: PublicKey
    temp_collateral_account: PublicKey
    mango_authority: PublicKey
    mango_account: PublicKey
    mango_program: PublicKey
    mango_group: PublicKey
    mango_cache: PublicKey
    mango_root_bank: PublicKey
    mango_node_bank: PublicKey
    mango_vault: PublicKey


def make_deposit_ix(
    args: gen_ix.UtpMangoDepositArgs,
    accounts: DepositAccounts,
    program_id: PublicKey,
    remaining_accounts: List[AccountMeta],
) -> TransactionInstruction:
    return gen_ix.utp_mango_deposit(
        args,
        accounts=gen_ix.UtpMangoDepositAccounts(
            marginfi_account=accounts.marginfi_account,
            marginfi_group=accounts.marginfi_group,
            signer=accounts.signer,
            margin_collateral_vault=accounts.margin_collateral_vault,
            bank_authority=accounts.bank_authority,
            temp_collateral_account=accounts.temp_collateral_account,
            mango_authority=accounts.mango_authority,
            mango_account=accounts.mango_account,
            mango_program=accounts.mango_program,
            mango_group=accounts.mango_group,
            mango_cache=accounts.mango_cache,
            mango_root_bank=accounts.mango_root_bank,
            mango_node_bank=accounts.mango_node_bank,
            mango_vault=accounts.mango_vault,
            token_program=TOKEN_PROGRAM_ID,
        ),
        program_id=program_id,
        remaining_accounts=remaining_accounts,
    )


# --- Withdraw


class WithdrawArgs(gen_ix.UtpMangoWithdrawArgs):
    pass


@dataclass
class WithdrawAccounts:
    marginfi_account: PublicKey
    marginfi_group: PublicKey
    signer: PublicKey
    margin_collateral_vault: PublicKey
    mango_authority: PublicKey
    mango_account: PublicKey
    mango_program: PublicKey
    mango_group: PublicKey
    mango_cache: PublicKey
    mango_root_bank: PublicKey
    mango_node_bank: PublicKey
    mango_vault: PublicKey
    mango_vault_authority: PublicKey


def make_withdraw_ix(
    args: gen_ix.UtpMangoWithdrawArgs,
    accounts: WithdrawAccounts,
    program_id: PublicKey,
    remaining_accounts: List[AccountMeta],
) -> TransactionInstruction:
    return gen_ix.utp_mango_withdraw(
        args,
        accounts=gen_ix.UtpMangoWithdrawAccounts(
            marginfi_account=accounts.marginfi_account,
            marginfi_group=accounts.marginfi_group,
            signer=accounts.signer,
            margin_collateral_vault=accounts.margin_collateral_vault,
            mango_authority=accounts.mango_authority,
            mango_account=accounts.mango_account,
            mango_program=accounts.mango_program,
            mango_group=accounts.mango_group,
            mango_cache=accounts.mango_cache,
            mango_root_bank=accounts.mango_root_bank,
            mango_node_bank=accounts.mango_node_bank,
            mango_vault=accounts.mango_vault,
            mango_vault_authority=accounts.mango_vault_authority,
            token_program=TOKEN_PROGRAM_ID,
        ),
        program_id=program_id,
        remaining_accounts=remaining_accounts,
    )


# --- Place order


class PlacePerpOrderArgs(UtpMangoPlacePerpOrderArgs):
    def __str__(self):
        return f"""
side: {self.side},
price: {int(self.price)},
max_base_quantity: {int(self.max_base_quantity)},
max_quote_quantity: {int(self.max_quote_quantity)},
client_order_id: {self.client_order_id},
order_type: {self.order_type},
reduce_only: {self.reduce_only},
expiry_timestamp: {self.expiry_timestamp},
limit: {self.limit},
expiry_type: {self.expiry_type},
        """


class PlacePerpOrderAccounts(gen_ix.UtpMangoUsePlacePerpOrderAccounts):
    pass


def make_place_perp_order_ix(
    args: PlacePerpOrderArgs,
    accounts: gen_ix.UtpMangoUsePlacePerpOrderAccounts,
    program_id: PublicKey,
    remaining_accounts: List[AccountMeta],
) -> TransactionInstruction:
    return gen_ix.utp_mango_use_place_perp_order(
        gen_ix.UtpMangoUsePlacePerpOrderArgs(args=args),
        accounts,
        program_id,
        remaining_accounts,
    )


# --- Cancel order


class CancelPerpOrderArgs(gen_ix.UtpMangoUseCancelPerpOrderArgs):
    pass


class CancelPerpOrderAccounts(gen_ix.UtpMangoUseCancelPerpOrderAccounts):
    pass


def make_cancel_perp_order_ix(
    args: gen_ix.UtpMangoUseCancelPerpOrderArgs,
    accounts: gen_ix.UtpMangoUseCancelPerpOrderAccounts,
    program_id: PublicKey,
    remaining_accounts: List[AccountMeta],
) -> TransactionInstruction:
    return gen_ix.utp_mango_use_cancel_perp_order(
        args, accounts, program_id, remaining_accounts
    )
