from __future__ import annotations
import typing
from solana.publickey import PublicKey
from solana.transaction import TransactionInstruction, AccountMeta
import borsh_construct as borsh
from ..program_id import PROGRAM_ID


class ForceCancelAllPerpOrdersArgs(typing.TypedDict):
    limit: int


layout = borsh.CStruct("limit" / borsh.U16)


class ForceCancelAllPerpOrdersAccounts(typing.TypedDict):
    pruner: PublicKey
    state: PublicKey
    cache: PublicKey
    state_signer: PublicKey
    liqee_margin: PublicKey
    liqee_control: PublicKey
    liqee_oo: PublicKey
    dex_market: PublicKey
    req_q: PublicKey
    event_q: PublicKey
    market_bids: PublicKey
    market_asks: PublicKey
    dex_program: PublicKey


def force_cancel_all_perp_orders(
    args: ForceCancelAllPerpOrdersArgs, accounts: ForceCancelAllPerpOrdersAccounts
) -> TransactionInstruction:
    keys: list[AccountMeta] = [
        AccountMeta(pubkey=accounts["pruner"], is_signer=True, is_writable=False),
        AccountMeta(pubkey=accounts["state"], is_signer=False, is_writable=False),
        AccountMeta(pubkey=accounts["cache"], is_signer=False, is_writable=True),
        AccountMeta(pubkey=accounts["state_signer"], is_signer=False, is_writable=True),
        AccountMeta(pubkey=accounts["liqee_margin"], is_signer=False, is_writable=True),
        AccountMeta(
            pubkey=accounts["liqee_control"], is_signer=False, is_writable=True
        ),
        AccountMeta(pubkey=accounts["liqee_oo"], is_signer=False, is_writable=True),
        AccountMeta(pubkey=accounts["dex_market"], is_signer=False, is_writable=True),
        AccountMeta(pubkey=accounts["req_q"], is_signer=False, is_writable=True),
        AccountMeta(pubkey=accounts["event_q"], is_signer=False, is_writable=True),
        AccountMeta(pubkey=accounts["market_bids"], is_signer=False, is_writable=True),
        AccountMeta(pubkey=accounts["market_asks"], is_signer=False, is_writable=True),
        AccountMeta(pubkey=accounts["dex_program"], is_signer=False, is_writable=False),
    ]
    identifier = b"\xe4\xb2y\xd4\xe6\xe8\xeb "
    encoded_args = layout.build(
        {
            "limit": args["limit"],
        }
    )
    data = identifier + encoded_args
    return TransactionInstruction(keys, PROGRAM_ID, data)
