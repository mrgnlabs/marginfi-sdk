from __future__ import annotations
import typing
from solana.publickey import PublicKey
from solana.transaction import TransactionInstruction, AccountMeta
from construct import Construct
import borsh_construct as borsh
from ..program_id import PROGRAM_ID


class CacheOracleArgs(typing.TypedDict):
    symbols: list[str]
    mock_prices: typing.Optional[list[typing.Optional[int]]]


layout = borsh.CStruct(
    "symbols" / borsh.Vec(typing.cast(Construct, borsh.String)),
    "mock_prices"
    / borsh.Option(borsh.Vec(typing.cast(Construct, borsh.Option(borsh.U64)))),
)


class CacheOracleAccounts(typing.TypedDict):
    signer: PublicKey
    state: PublicKey
    cache: PublicKey
    dex_program: PublicKey


def cache_oracle(
    args: CacheOracleArgs, accounts: CacheOracleAccounts
) -> TransactionInstruction:
    keys: list[AccountMeta] = [
        AccountMeta(pubkey=accounts["signer"], is_signer=True, is_writable=False),
        AccountMeta(pubkey=accounts["state"], is_signer=False, is_writable=False),
        AccountMeta(pubkey=accounts["cache"], is_signer=False, is_writable=True),
        AccountMeta(pubkey=accounts["dex_program"], is_signer=False, is_writable=False),
    ]
    identifier = b"\xf1\xdc\x83W\xf5\x92\xc9\x83"
    encoded_args = layout.build(
        {
            "symbols": args["symbols"],
            "mock_prices": args["mock_prices"],
        }
    )
    data = identifier + encoded_args
    return TransactionInstruction(keys, PROGRAM_ID, data)
