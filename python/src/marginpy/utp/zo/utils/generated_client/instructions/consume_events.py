from __future__ import annotations
import typing
from solana.publickey import PublicKey
from solana.transaction import TransactionInstruction, AccountMeta
import borsh_construct as borsh
from ..program_id import PROGRAM_ID


class ConsumeEventsArgs(typing.TypedDict):
    limit: int


layout = borsh.CStruct("limit" / borsh.U16)


class ConsumeEventsAccounts(typing.TypedDict):
    state: PublicKey
    state_signer: PublicKey
    dex_program: PublicKey
    market: PublicKey
    event_queue: PublicKey


def consume_events(
    args: ConsumeEventsArgs, accounts: ConsumeEventsAccounts
) -> TransactionInstruction:
    keys: list[AccountMeta] = [
        AccountMeta(pubkey=accounts["state"], is_signer=False, is_writable=True),
        AccountMeta(pubkey=accounts["state_signer"], is_signer=False, is_writable=True),
        AccountMeta(pubkey=accounts["dex_program"], is_signer=False, is_writable=False),
        AccountMeta(pubkey=accounts["market"], is_signer=False, is_writable=True),
        AccountMeta(pubkey=accounts["event_queue"], is_signer=False, is_writable=True),
    ]
    identifier = b"\xdd\x91\xb14\x1f/?\xc9"
    encoded_args = layout.build(
        {
            "limit": args["limit"],
        }
    )
    data = identifier + encoded_args
    return TransactionInstruction(keys, PROGRAM_ID, data)
