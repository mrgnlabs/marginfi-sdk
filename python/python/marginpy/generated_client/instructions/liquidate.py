from __future__ import annotations

import typing

import borsh_construct as borsh
from solana.publickey import PublicKey
from solana.transaction import AccountMeta, TransactionInstruction

from ..program_id import PROGRAM_ID


class LiquidateArgs(typing.TypedDict):
    utp_index: int


layout = borsh.CStruct("utp_index" / borsh.U64)


class LiquidateAccounts(typing.TypedDict):
    marginfi_account: PublicKey
    marginfi_group: PublicKey
    signer: PublicKey
    marginfi_account_liquidatee: PublicKey
    bank_vault: PublicKey
    bank_authority: PublicKey
    bank_insurance_vault: PublicKey
    token_program: PublicKey


def liquidate(
    args: LiquidateArgs,
    accounts: LiquidateAccounts,
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
            pubkey=accounts["marginfi_account_liquidatee"],
            is_signer=False,
            is_writable=True,
        ),
        AccountMeta(pubkey=accounts["bank_vault"], is_signer=False, is_writable=True),
        AccountMeta(
            pubkey=accounts["bank_authority"], is_signer=False, is_writable=False
        ),
        AccountMeta(
            pubkey=accounts["bank_insurance_vault"], is_signer=False, is_writable=True
        ),
        AccountMeta(
            pubkey=accounts["token_program"], is_signer=False, is_writable=False
        ),
    ]
    if remaining_accounts is not None:
        keys += remaining_accounts
    identifier = b"\xdf\xb3\xe2}0.'J"
    encoded_args = layout.build(
        {
            "utp_index": args["utp_index"],
        }
    )
    data = identifier + encoded_args
    return TransactionInstruction(keys, program_id, data)
