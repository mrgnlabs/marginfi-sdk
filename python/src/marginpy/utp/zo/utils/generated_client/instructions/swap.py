from __future__ import annotations
import typing
from solana.publickey import PublicKey
from solana.transaction import TransactionInstruction, AccountMeta
import borsh_construct as borsh
from ..program_id import PROGRAM_ID


class SwapArgs(typing.TypedDict):
    buy: bool
    allow_borrow: bool
    amount: int
    min_rate: int


layout = borsh.CStruct(
    "buy" / borsh.Bool,
    "allow_borrow" / borsh.Bool,
    "amount" / borsh.U64,
    "min_rate" / borsh.U64,
)


class SwapAccounts(typing.TypedDict):
    authority: PublicKey
    state: PublicKey
    state_signer: PublicKey
    cache: PublicKey
    margin: PublicKey
    control: PublicKey
    quote_mint: PublicKey
    quote_vault: PublicKey
    asset_mint: PublicKey
    asset_vault: PublicKey
    swap_fee_vault: PublicKey
    serum_open_orders: PublicKey
    serum_market: PublicKey
    serum_request_queue: PublicKey
    serum_event_queue: PublicKey
    serum_bids: PublicKey
    serum_asks: PublicKey
    serum_coin_vault: PublicKey
    serum_pc_vault: PublicKey
    serum_vault_signer: PublicKey
    srm_spot_program: PublicKey
    token_program: PublicKey
    rent: PublicKey


def swap(args: SwapArgs, accounts: SwapAccounts) -> TransactionInstruction:
    keys: list[AccountMeta] = [
        AccountMeta(pubkey=accounts["authority"], is_signer=True, is_writable=False),
        AccountMeta(pubkey=accounts["state"], is_signer=False, is_writable=True),
        AccountMeta(
            pubkey=accounts["state_signer"], is_signer=False, is_writable=False
        ),
        AccountMeta(pubkey=accounts["cache"], is_signer=False, is_writable=True),
        AccountMeta(pubkey=accounts["margin"], is_signer=False, is_writable=True),
        AccountMeta(pubkey=accounts["control"], is_signer=False, is_writable=True),
        AccountMeta(pubkey=accounts["quote_mint"], is_signer=False, is_writable=False),
        AccountMeta(pubkey=accounts["quote_vault"], is_signer=False, is_writable=True),
        AccountMeta(pubkey=accounts["asset_mint"], is_signer=False, is_writable=False),
        AccountMeta(pubkey=accounts["asset_vault"], is_signer=False, is_writable=True),
        AccountMeta(
            pubkey=accounts["swap_fee_vault"], is_signer=False, is_writable=True
        ),
        AccountMeta(
            pubkey=accounts["serum_open_orders"], is_signer=False, is_writable=True
        ),
        AccountMeta(pubkey=accounts["serum_market"], is_signer=False, is_writable=True),
        AccountMeta(
            pubkey=accounts["serum_request_queue"], is_signer=False, is_writable=True
        ),
        AccountMeta(
            pubkey=accounts["serum_event_queue"], is_signer=False, is_writable=True
        ),
        AccountMeta(pubkey=accounts["serum_bids"], is_signer=False, is_writable=True),
        AccountMeta(pubkey=accounts["serum_asks"], is_signer=False, is_writable=True),
        AccountMeta(
            pubkey=accounts["serum_coin_vault"], is_signer=False, is_writable=True
        ),
        AccountMeta(
            pubkey=accounts["serum_pc_vault"], is_signer=False, is_writable=True
        ),
        AccountMeta(
            pubkey=accounts["serum_vault_signer"], is_signer=False, is_writable=False
        ),
        AccountMeta(
            pubkey=accounts["srm_spot_program"], is_signer=False, is_writable=False
        ),
        AccountMeta(
            pubkey=accounts["token_program"], is_signer=False, is_writable=False
        ),
        AccountMeta(pubkey=accounts["rent"], is_signer=False, is_writable=False),
    ]
    identifier = b"\xf8\xc6\x9e\x91\xe1u\x87\xc8"
    encoded_args = layout.build(
        {
            "buy": args["buy"],
            "allow_borrow": args["allow_borrow"],
            "amount": args["amount"],
            "min_rate": args["min_rate"],
        }
    )
    data = identifier + encoded_args
    return TransactionInstruction(keys, PROGRAM_ID, data)
