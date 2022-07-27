from __future__ import annotations
import typing
from solana.publickey import PublicKey
from solana.transaction import TransactionInstruction, AccountMeta
import borsh_construct as borsh
from ..program_id import PROGRAM_ID


class CacheInterestRatesArgs(typing.TypedDict):
    start: int
    end: int


layout = borsh.CStruct("start" / borsh.U8, "end" / borsh.U8)


class CacheInterestRatesAccounts(typing.TypedDict):
    signer: PublicKey
    state: PublicKey
    cache: PublicKey


def cache_interest_rates(
    args: CacheInterestRatesArgs, accounts: CacheInterestRatesAccounts
) -> TransactionInstruction:
    keys: list[AccountMeta] = [
        AccountMeta(pubkey=accounts["signer"], is_signer=True, is_writable=False),
        AccountMeta(pubkey=accounts["state"], is_signer=False, is_writable=False),
        AccountMeta(pubkey=accounts["cache"], is_signer=False, is_writable=True),
    ]
    identifier = b"\xcb\xe0\x80J\xe1*\x7fQ"
    encoded_args = layout.build(
        {
            "start": args["start"],
            "end": args["end"],
        }
    )
    data = identifier + encoded_args
    return TransactionInstruction(keys, PROGRAM_ID, data)
