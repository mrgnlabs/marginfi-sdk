from __future__ import annotations

import typing

import borsh_construct as borsh
from solana.publickey import PublicKey
from solana.transaction import AccountMeta, TransactionInstruction

from .. import types
from ..program_id import PROGRAM_ID


class UtpZoPlacePerpOrderArgs(typing.TypedDict):
    args: types.utp_zo_place_perp_order_ix_args.UtpZoPlacePerpOrderIxArgs


layout = borsh.CStruct(
    "args" / types.utp_zo_place_perp_order_ix_args.UtpZoPlacePerpOrderIxArgs.layout
)


class UtpZoPlacePerpOrderAccounts(typing.TypedDict):
    header: HeaderNested
    zo_program: PublicKey
    state: PublicKey
    state_signer: PublicKey
    cache: PublicKey
    margin: PublicKey
    control: PublicKey
    open_orders: PublicKey
    dex_market: PublicKey
    req_q: PublicKey
    event_q: PublicKey
    market_bids: PublicKey
    market_asks: PublicKey
    dex_program: PublicKey
    rent: PublicKey


class HeaderNested(typing.TypedDict):
    marginfi_account: PublicKey
    marginfi_group: PublicKey
    signer: PublicKey
    utp_authority: PublicKey


def utp_zo_place_perp_order(
    args: UtpZoPlacePerpOrderArgs,
    accounts: UtpZoPlacePerpOrderAccounts,
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
        AccountMeta(pubkey=accounts["state_signer"], is_signer=False, is_writable=True),
        AccountMeta(pubkey=accounts["cache"], is_signer=False, is_writable=True),
        AccountMeta(pubkey=accounts["margin"], is_signer=False, is_writable=True),
        AccountMeta(pubkey=accounts["control"], is_signer=False, is_writable=True),
        AccountMeta(pubkey=accounts["open_orders"], is_signer=False, is_writable=True),
        AccountMeta(pubkey=accounts["dex_market"], is_signer=False, is_writable=True),
        AccountMeta(pubkey=accounts["req_q"], is_signer=False, is_writable=True),
        AccountMeta(pubkey=accounts["event_q"], is_signer=False, is_writable=True),
        AccountMeta(pubkey=accounts["market_bids"], is_signer=False, is_writable=True),
        AccountMeta(pubkey=accounts["market_asks"], is_signer=False, is_writable=True),
        AccountMeta(pubkey=accounts["dex_program"], is_signer=False, is_writable=False),
        AccountMeta(pubkey=accounts["rent"], is_signer=False, is_writable=False),
    ]
    if remaining_accounts is not None:
        keys += remaining_accounts
    identifier = b"\x03\x084\x14\t\xa9\x7f\xba"
    encoded_args = layout.build(
        {
            "args": args["args"].to_encodable(),
        }
    )
    data = identifier + encoded_args
    return TransactionInstruction(keys, program_id, data)
