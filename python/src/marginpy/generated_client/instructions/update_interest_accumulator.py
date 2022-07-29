from __future__ import annotations

import typing

from solana.publickey import PublicKey
from solana.transaction import AccountMeta, TransactionInstruction

from ..program_id import PROGRAM_ID


class UpdateInterestAccumulatorAccounts(typing.TypedDict):
    marginfi_group: PublicKey
    bank_vault: PublicKey
    bank_authority: PublicKey
    bank_fee_vault: PublicKey
    token_program: PublicKey


def update_interest_accumulator(
    accounts: UpdateInterestAccumulatorAccounts,
    program_id: PublicKey = PROGRAM_ID,
    remaining_accounts: typing.Optional[typing.List[AccountMeta]] = None,
) -> TransactionInstruction:
    keys: list[AccountMeta] = [
        AccountMeta(
            pubkey=accounts["marginfi_group"], is_signer=False, is_writable=True
        ),
        AccountMeta(pubkey=accounts["bank_vault"], is_signer=False, is_writable=True),
        AccountMeta(
            pubkey=accounts["bank_authority"], is_signer=False, is_writable=False
        ),
        AccountMeta(
            pubkey=accounts["bank_fee_vault"], is_signer=False, is_writable=True
        ),
        AccountMeta(
            pubkey=accounts["token_program"], is_signer=False, is_writable=False
        ),
    ]
    if remaining_accounts is not None:
        keys += remaining_accounts
    identifier = b"\xe0\xfe\xe9t%\xf6\xda\x02"
    encoded_args = b""
    data = identifier + encoded_args
    return TransactionInstruction(keys, program_id, data)
