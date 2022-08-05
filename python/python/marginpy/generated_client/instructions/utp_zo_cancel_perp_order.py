from __future__ import annotations

import typing

import borsh_construct as borsh
from solana.publickey import PublicKey
from solana.transaction import AccountMeta, TransactionInstruction

from ..program_id import PROGRAM_ID


class UtpZoCancelPerpOrderArgs(typing.TypedDict):
    order_id: typing.Optional[int]
    is_long: typing.Optional[bool]
    client_id: typing.Optional[int]


layout = borsh.CStruct(
    "order_id" / borsh.Option(borsh.U128),
    "is_long" / borsh.Option(borsh.Bool),
    "client_id" / borsh.Option(borsh.U64),
)


class UtpZoCancelPerpOrderAccounts(typing.TypedDict):
    header: HeaderNested
    zo_program: PublicKey
    state: PublicKey
    cache: PublicKey
    margin: PublicKey
    control: PublicKey
    open_orders: PublicKey
    dex_market: PublicKey
    market_bids: PublicKey
    market_asks: PublicKey
    event_q: PublicKey
    dex_program: PublicKey


class HeaderNested(typing.TypedDict):
    marginfi_account: PublicKey
    marginfi_group: PublicKey
    signer: PublicKey
    utp_authority: PublicKey


def utp_zo_cancel_perp_order(
    args: UtpZoCancelPerpOrderArgs,
    accounts: UtpZoCancelPerpOrderAccounts,
    program_id: PublicKey = PROGRAM_ID,
    remaining_accounts: typing.Optional[typing.List[AccountMeta]] = None,
) -> TransactionInstruction:
    keys: list[AccountMeta] = [
        AccountMeta(
            pubkey=accounts["header"]["marginfi_account"],
            is_signer=False,
            is_writable=False,
        ),
        AccountMeta(
            pubkey=accounts["header"]["marginfi_group"],
            is_signer=False,
            is_writable=False,
        ),
        AccountMeta(
            pubkey=accounts["header"]["signer"], is_signer=True, is_writable=True
        ),
        AccountMeta(
            pubkey=accounts["header"]["utp_authority"],
            is_signer=False,
            is_writable=False,
        ),
        AccountMeta(pubkey=accounts["zo_program"], is_signer=False, is_writable=False),
        AccountMeta(pubkey=accounts["state"], is_signer=False, is_writable=False),
        AccountMeta(pubkey=accounts["cache"], is_signer=False, is_writable=True),
        AccountMeta(pubkey=accounts["margin"], is_signer=False, is_writable=True),
        AccountMeta(pubkey=accounts["control"], is_signer=False, is_writable=True),
        AccountMeta(pubkey=accounts["open_orders"], is_signer=False, is_writable=True),
        AccountMeta(pubkey=accounts["dex_market"], is_signer=False, is_writable=True),
        AccountMeta(pubkey=accounts["market_bids"], is_signer=False, is_writable=True),
        AccountMeta(pubkey=accounts["market_asks"], is_signer=False, is_writable=True),
        AccountMeta(pubkey=accounts["event_q"], is_signer=False, is_writable=True),
        AccountMeta(pubkey=accounts["dex_program"], is_signer=False, is_writable=False),
    ]
    if remaining_accounts is not None:
        keys += remaining_accounts
    identifier = b'\xf2\x0e"\xa0\xcell\x03'
    encoded_args = layout.build(
        {
            "order_id": args["order_id"],
            "is_long": args["is_long"],
            "client_id": args["client_id"],
        }
    )
    data = identifier + encoded_args
    return TransactionInstruction(keys, program_id, data)
