from __future__ import annotations

import typing

import borsh_construct as borsh
from solana.publickey import PublicKey
from solana.transaction import AccountMeta, TransactionInstruction

from .. import types
from ..program_id import PROGRAM_ID


class UtpMangoUsePlacePerpOrderArgs(typing.TypedDict):
    args: types.utp_mango_place_perp_order_args.UtpMangoPlacePerpOrderArgs


layout = borsh.CStruct(
    "args" / types.utp_mango_place_perp_order_args.UtpMangoPlacePerpOrderArgs.layout
)


class UtpMangoUsePlacePerpOrderAccounts(typing.TypedDict):
    marginfi_account: PublicKey
    marginfi_group: PublicKey
    signer: PublicKey
    mango_authority: PublicKey
    mango_account: PublicKey
    mango_program: PublicKey
    mango_group: PublicKey
    mango_cache: PublicKey
    mango_perp_market: PublicKey
    mango_bids: PublicKey
    mango_asks: PublicKey
    mango_event_queue: PublicKey


def utp_mango_use_place_perp_order(
    args: UtpMangoUsePlacePerpOrderArgs,
    accounts: UtpMangoUsePlacePerpOrderAccounts,
    program_id: PublicKey = PROGRAM_ID,
    remaining_accounts: typing.Optional[typing.List[AccountMeta]] = None,
) -> TransactionInstruction:
    keys: list[AccountMeta] = [
        AccountMeta(
            pubkey=accounts["marginfi_account"], is_signer=False, is_writable=False
        ),
        AccountMeta(
            pubkey=accounts["marginfi_group"], is_signer=False, is_writable=False
        ),
        AccountMeta(pubkey=accounts["signer"], is_signer=True, is_writable=True),
        AccountMeta(
            pubkey=accounts["mango_authority"], is_signer=False, is_writable=False
        ),
        AccountMeta(
            pubkey=accounts["mango_account"], is_signer=False, is_writable=True
        ),
        AccountMeta(
            pubkey=accounts["mango_program"], is_signer=False, is_writable=False
        ),
        AccountMeta(pubkey=accounts["mango_group"], is_signer=False, is_writable=False),
        AccountMeta(pubkey=accounts["mango_cache"], is_signer=False, is_writable=False),
        AccountMeta(
            pubkey=accounts["mango_perp_market"], is_signer=False, is_writable=True
        ),
        AccountMeta(pubkey=accounts["mango_bids"], is_signer=False, is_writable=True),
        AccountMeta(pubkey=accounts["mango_asks"], is_signer=False, is_writable=True),
        AccountMeta(
            pubkey=accounts["mango_event_queue"], is_signer=False, is_writable=True
        ),
    ]
    if remaining_accounts is not None:
        keys += remaining_accounts
    identifier = b"\x94\x12\xdd\xcb\xd6\xffv4"
    encoded_args = layout.build(
        {
            "args": args["args"].to_encodable(),
        }
    )
    data = identifier + encoded_args
    return TransactionInstruction(keys, program_id, data)
