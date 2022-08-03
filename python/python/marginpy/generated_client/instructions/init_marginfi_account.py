from __future__ import annotations

import typing

from solana.publickey import PublicKey
from solana.transaction import AccountMeta, TransactionInstruction

from ..program_id import PROGRAM_ID


class InitMarginfiAccountAccounts(typing.TypedDict):
    authority: PublicKey
    marginfi_group: PublicKey
    marginfi_account: PublicKey
    system_program: PublicKey


def init_marginfi_account(
    accounts: InitMarginfiAccountAccounts,
    program_id: PublicKey = PROGRAM_ID,
    remaining_accounts: typing.Optional[typing.List[AccountMeta]] = None,
) -> TransactionInstruction:
    keys: list[AccountMeta] = [
        AccountMeta(pubkey=accounts["authority"], is_signer=True, is_writable=True),
        AccountMeta(
            pubkey=accounts["marginfi_group"], is_signer=False, is_writable=False
        ),
        AccountMeta(
            pubkey=accounts["marginfi_account"], is_signer=False, is_writable=True
        ),
        AccountMeta(
            pubkey=accounts["system_program"], is_signer=False, is_writable=False
        ),
    ]
    if remaining_accounts is not None:
        keys += remaining_accounts
    identifier = b"\xe1\xd4D\xe9>`\xf2g"
    encoded_args = b""
    data = identifier + encoded_args
    return TransactionInstruction(keys, program_id, data)
