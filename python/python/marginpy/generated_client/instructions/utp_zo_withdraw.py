from __future__ import annotations

import typing

import borsh_construct as borsh
from solana.publickey import PublicKey
from solana.transaction import AccountMeta, TransactionInstruction

from ..program_id import PROGRAM_ID


class UtpZoWithdrawArgs(typing.TypedDict):
    amount: int


layout = borsh.CStruct("amount" / borsh.U64)


class UtpZoWithdrawAccounts(typing.TypedDict):
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
    heimdall: PublicKey
    token_program: PublicKey


def utp_zo_withdraw(
    args: UtpZoWithdrawArgs,
    accounts: UtpZoWithdrawAccounts,
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
        AccountMeta(pubkey=accounts["signer"], is_signer=True, is_writable=False),
        AccountMeta(
            pubkey=accounts["margin_collateral_vault"],
            is_signer=False,
            is_writable=True,
        ),
        AccountMeta(
            pubkey=accounts["utp_authority"], is_signer=False, is_writable=False
        ),
        AccountMeta(pubkey=accounts["zo_margin"], is_signer=False, is_writable=True),
        AccountMeta(pubkey=accounts["zo_program"], is_signer=False, is_writable=False),
        AccountMeta(pubkey=accounts["zo_state"], is_signer=False, is_writable=True),
        AccountMeta(
            pubkey=accounts["zo_state_signer"], is_signer=False, is_writable=True
        ),
        AccountMeta(pubkey=accounts["zo_cache"], is_signer=False, is_writable=True),
        AccountMeta(pubkey=accounts["zo_control"], is_signer=False, is_writable=True),
        AccountMeta(pubkey=accounts["zo_vault"], is_signer=False, is_writable=True),
        AccountMeta(pubkey=accounts["heimdall"], is_signer=False, is_writable=True),
        AccountMeta(
            pubkey=accounts["token_program"], is_signer=False, is_writable=False
        ),
    ]
    if remaining_accounts is not None:
        keys += remaining_accounts
    identifier = b"\xfd\xcbp1\xc3\xa5\xa3\xd1"
    encoded_args = layout.build(
        {
            "amount": args["amount"],
        }
    )
    data = identifier + encoded_args
    return TransactionInstruction(keys, program_id, data)
