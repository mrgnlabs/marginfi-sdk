from __future__ import annotations

import typing

import borsh_construct as borsh
from solana.publickey import PublicKey
from solana.transaction import AccountMeta, TransactionInstruction

from ..program_id import PROGRAM_ID


class DeactivateUtpArgs(typing.TypedDict):
    utp_index: int


layout = borsh.CStruct("utp_index" / borsh.U64)


class DeactivateUtpAccounts(typing.TypedDict):
    marginfi_account: PublicKey
    authority: PublicKey


def deactivate_utp(
    args: DeactivateUtpArgs,
    accounts: DeactivateUtpAccounts,
    program_id: PublicKey = PROGRAM_ID,
    remaining_accounts: typing.Optional[typing.List[AccountMeta]] = None,
) -> TransactionInstruction:
    keys: list[AccountMeta] = [
        AccountMeta(
            pubkey=accounts["marginfi_account"], is_signer=False, is_writable=True
        ),
        AccountMeta(pubkey=accounts["authority"], is_signer=True, is_writable=False),
    ]
    if remaining_accounts is not None:
        keys += remaining_accounts
    identifier = b"^\xd4\x01\xd7/.H/"
    encoded_args = layout.build(
        {
            "utp_index": args["utp_index"],
        }
    )
    data = identifier + encoded_args
    return TransactionInstruction(keys, program_id, data)
