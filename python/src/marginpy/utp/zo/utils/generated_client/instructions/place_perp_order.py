from __future__ import annotations
import typing
from solana.publickey import PublicKey
from solana.transaction import TransactionInstruction, AccountMeta
import borsh_construct as borsh
from .. import types
from ..program_id import PROGRAM_ID


class PlacePerpOrderArgs(typing.TypedDict):
    is_long: bool
    limit_price: int
    max_base_quantity: int
    max_quote_quantity: int
    order_type: types.order_type.OrderTypeKind
    limit: int
    client_id: int


layout = borsh.CStruct(
    "is_long" / borsh.Bool,
    "limit_price" / borsh.U64,
    "max_base_quantity" / borsh.U64,
    "max_quote_quantity" / borsh.U64,
    "order_type" / types.order_type.layout,
    "limit" / borsh.U16,
    "client_id" / borsh.U64,
)


class PlacePerpOrderAccounts(typing.TypedDict):
    state: PublicKey
    state_signer: PublicKey
    cache: PublicKey
    authority: PublicKey
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


def place_perp_order(
    args: PlacePerpOrderArgs, accounts: PlacePerpOrderAccounts
) -> TransactionInstruction:
    keys: list[AccountMeta] = [
        AccountMeta(pubkey=accounts["state"], is_signer=False, is_writable=False),
        AccountMeta(pubkey=accounts["state_signer"], is_signer=False, is_writable=True),
        AccountMeta(pubkey=accounts["cache"], is_signer=False, is_writable=True),
        AccountMeta(pubkey=accounts["authority"], is_signer=True, is_writable=False),
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
    identifier = b"E\xa1]\xcax~L\xb9"
    encoded_args = layout.build(
        {
            "is_long": args["is_long"],
            "limit_price": args["limit_price"],
            "max_base_quantity": args["max_base_quantity"],
            "max_quote_quantity": args["max_quote_quantity"],
            "order_type": args["order_type"].to_encodable(),
            "limit": args["limit"],
            "client_id": args["client_id"],
        }
    )
    data = identifier + encoded_args
    return TransactionInstruction(keys, PROGRAM_ID, data)
