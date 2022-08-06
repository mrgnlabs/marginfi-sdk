from __future__ import annotations

import typing

import borsh_construct as borsh
from solana.publickey import PublicKey
from solana.transaction import AccountMeta, TransactionInstruction

from ..program_id import PROGRAM_ID


class UtpMangoDepositArgs(typing.TypedDict):
    amount: int


layout = borsh.CStruct("amount" / borsh.U64)


class UtpMangoDepositAccounts(typing.TypedDict):
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
    token_program: PublicKey


def utp_mango_deposit(
    args: UtpMangoDepositArgs,
    accounts: UtpMangoDepositAccounts,
    program_id: PublicKey = PROGRAM_ID,
    remaining_accounts: typing.Optional[typing.List[AccountMeta]] = None,
) -> TransactionInstruction:
    keys: list[AccountMeta] = [
        AccountMeta(
            pubkey=accounts["marginfi_account"], is_signer=False, is_writable=True
        ),
        AccountMeta(
            pubkey=accounts["marginfi_group"], is_signer=False, is_writable=True
        ),
        AccountMeta(pubkey=accounts["signer"], is_signer=True, is_writable=True),
        AccountMeta(
            pubkey=accounts["margin_collateral_vault"],
            is_signer=False,
            is_writable=True,
        ),
        AccountMeta(
            pubkey=accounts["bank_authority"], is_signer=False, is_writable=False
        ),
        AccountMeta(
            pubkey=accounts["temp_collateral_account"],
            is_signer=False,
            is_writable=True,
        ),
        AccountMeta(
            pubkey=accounts["mango_authority"], is_signer=False, is_writable=False
        ),
        AccountMeta(
            pubkey=accounts["mango_account"], is_signer=False, is_writable=True
        ),
        AccountMeta(
            pubkey=accounts["mango_program"], is_signer=False, is_writable=False
        ),
        AccountMeta(pubkey=accounts["mango_group"], is_signer=False, is_writable=False),
        AccountMeta(pubkey=accounts["mango_cache"], is_signer=False, is_writable=True),
        AccountMeta(
            pubkey=accounts["mango_root_bank"], is_signer=False, is_writable=True
        ),
        AccountMeta(
            pubkey=accounts["mango_node_bank"], is_signer=False, is_writable=True
        ),
        AccountMeta(pubkey=accounts["mango_vault"], is_signer=False, is_writable=True),
        AccountMeta(
            pubkey=accounts["token_program"], is_signer=False, is_writable=False
        ),
    ]
    if remaining_accounts is not None:
        keys += remaining_accounts
    identifier = b"X(HHw\x7f'\xe5"
    encoded_args = layout.build(
        {
            "amount": args["amount"],
        }
    )
    data = identifier + encoded_args
    return TransactionInstruction(keys, program_id, data)
