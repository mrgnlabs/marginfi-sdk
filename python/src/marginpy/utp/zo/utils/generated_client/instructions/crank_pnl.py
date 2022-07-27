from __future__ import annotations
import typing
from solana.publickey import PublicKey
from solana.transaction import TransactionInstruction, AccountMeta
from ..program_id import PROGRAM_ID


class CrankPnlAccounts(typing.TypedDict):
    state: PublicKey
    state_signer: PublicKey
    cache: PublicKey
    dex_program: PublicKey
    market: PublicKey


def crank_pnl(accounts: CrankPnlAccounts) -> TransactionInstruction:
    keys: list[AccountMeta] = [
        AccountMeta(pubkey=accounts["state"], is_signer=False, is_writable=False),
        AccountMeta(pubkey=accounts["state_signer"], is_signer=False, is_writable=True),
        AccountMeta(pubkey=accounts["cache"], is_signer=False, is_writable=True),
        AccountMeta(pubkey=accounts["dex_program"], is_signer=False, is_writable=False),
        AccountMeta(pubkey=accounts["market"], is_signer=False, is_writable=True),
    ]
    identifier = b"\xd6\x99\t\xa1\x07\xf7\xd0\x19"
    encoded_args = b""
    data = identifier + encoded_args
    return TransactionInstruction(keys, PROGRAM_ID, data)
