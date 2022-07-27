from __future__ import annotations
import typing
from solana.publickey import PublicKey
from solana.transaction import TransactionInstruction, AccountMeta
import borsh_construct as borsh
from ..program_id import PROGRAM_ID


class CancelPerpOrderArgs(typing.TypedDict):
    order_id: typing.Optional[int]
    is_long: typing.Optional[bool]
    client_id: typing.Optional[int]


layout = borsh.CStruct(
    "order_id" / borsh.Option(borsh.U128),
    "is_long" / borsh.Option(borsh.Bool),
    "client_id" / borsh.Option(borsh.U64),
)


class CancelPerpOrderAccounts(typing.TypedDict):
    state: PublicKey
    cache: PublicKey
    authority: PublicKey
    margin: PublicKey
    control: PublicKey
    open_orders: PublicKey
    dex_market: PublicKey
    market_bids: PublicKey
    market_asks: PublicKey
    event_q: PublicKey
    dex_program: PublicKey


def cancel_perp_order(
    args: CancelPerpOrderArgs, accounts: CancelPerpOrderAccounts
) -> TransactionInstruction:
    keys: list[AccountMeta] = [
        AccountMeta(pubkey=accounts["state"], is_signer=False, is_writable=False),
        AccountMeta(pubkey=accounts["cache"], is_signer=False, is_writable=True),
        AccountMeta(pubkey=accounts["authority"], is_signer=True, is_writable=False),
        AccountMeta(pubkey=accounts["margin"], is_signer=False, is_writable=True),
        AccountMeta(pubkey=accounts["control"], is_signer=False, is_writable=True),
        AccountMeta(pubkey=accounts["open_orders"], is_signer=False, is_writable=True),
        AccountMeta(pubkey=accounts["dex_market"], is_signer=False, is_writable=True),
        AccountMeta(pubkey=accounts["market_bids"], is_signer=False, is_writable=True),
        AccountMeta(pubkey=accounts["market_asks"], is_signer=False, is_writable=True),
        AccountMeta(pubkey=accounts["event_q"], is_signer=False, is_writable=True),
        AccountMeta(pubkey=accounts["dex_program"], is_signer=False, is_writable=False),
    ]
    identifier = b"\xacO\xcf\x11\xf3\xd6\xf2\xc6"
    encoded_args = layout.build(
        {
            "order_id": args["order_id"],
            "is_long": args["is_long"],
            "client_id": args["client_id"],
        }
    )
    data = identifier + encoded_args
    return TransactionInstruction(keys, PROGRAM_ID, data)
