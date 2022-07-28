from __future__ import annotations

import typing

import borsh_construct as borsh
from solana.publickey import PublicKey
from solana.transaction import AccountMeta, TransactionInstruction

from ..program_id import PROGRAM_ID


class UtpZoDepositArgs(typing.TypedDict):
    amount: int


layout = borsh.CStruct("amount" / borsh.U64)


class UtpZoDepositAccounts(typing.TypedDict):
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
    rent: PublicKey
    token_program: PublicKey
    system_program: PublicKey


def utp_zo_deposit(
    args: UtpZoDepositArgs,
    accounts: UtpZoDepositAccounts,
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
            pubkey=accounts["utp_authority"], is_signer=False, is_writable=False
        ),
        AccountMeta(pubkey=accounts["zo_program"], is_signer=False, is_writable=False),
        AccountMeta(pubkey=accounts["zo_state"], is_signer=False, is_writable=False),
        AccountMeta(
            pubkey=accounts["zo_state_signer"], is_signer=False, is_writable=False
        ),
        AccountMeta(pubkey=accounts["zo_cache"], is_signer=False, is_writable=True),
        AccountMeta(pubkey=accounts["zo_margin"], is_signer=False, is_writable=True),
        AccountMeta(pubkey=accounts["zo_vault"], is_signer=False, is_writable=True),
        AccountMeta(pubkey=accounts["rent"], is_signer=False, is_writable=False),
        AccountMeta(
            pubkey=accounts["token_program"], is_signer=False, is_writable=False
        ),
        AccountMeta(
            pubkey=accounts["system_program"], is_signer=False, is_writable=False
        ),
    ]
    if remaining_accounts is not None:
        keys += remaining_accounts
    identifier = b"\x8a\x1a\xab\x0e\x10\xc7\xc3|"
    encoded_args = layout.build(
        {
            "amount": args["amount"],
        }
    )
    data = identifier + encoded_args
    return TransactionInstruction(keys, program_id, data)
