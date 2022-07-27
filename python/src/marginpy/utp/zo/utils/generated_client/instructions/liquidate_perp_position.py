from __future__ import annotations
import typing
from solana.publickey import PublicKey
from solana.transaction import TransactionInstruction, AccountMeta
import borsh_construct as borsh
from ..program_id import PROGRAM_ID


class LiquidatePerpPositionArgs(typing.TypedDict):
    asset_transfer_lots: int


layout = borsh.CStruct("asset_transfer_lots" / borsh.U64)


class LiquidatePerpPositionAccounts(typing.TypedDict):
    state: PublicKey
    cache: PublicKey
    state_signer: PublicKey
    liqor: PublicKey
    liqor_margin: PublicKey
    liqor_control: PublicKey
    liqor_oo: PublicKey
    liqee: PublicKey
    liqee_margin: PublicKey
    liqee_control: PublicKey
    liqee_oo: PublicKey
    dex_market: PublicKey
    req_q: PublicKey
    event_q: PublicKey
    market_bids: PublicKey
    market_asks: PublicKey
    dex_program: PublicKey


def liquidate_perp_position(
    args: LiquidatePerpPositionArgs, accounts: LiquidatePerpPositionAccounts
) -> TransactionInstruction:
    keys: list[AccountMeta] = [
        AccountMeta(pubkey=accounts["state"], is_signer=False, is_writable=False),
        AccountMeta(pubkey=accounts["cache"], is_signer=False, is_writable=True),
        AccountMeta(pubkey=accounts["state_signer"], is_signer=False, is_writable=True),
        AccountMeta(pubkey=accounts["liqor"], is_signer=True, is_writable=False),
        AccountMeta(pubkey=accounts["liqor_margin"], is_signer=False, is_writable=True),
        AccountMeta(
            pubkey=accounts["liqor_control"], is_signer=False, is_writable=True
        ),
        AccountMeta(pubkey=accounts["liqor_oo"], is_signer=False, is_writable=True),
        AccountMeta(pubkey=accounts["liqee"], is_signer=False, is_writable=False),
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
    identifier = b"]\xf7\x86Dg<\xcc\x8c"
    encoded_args = layout.build(
        {
            "asset_transfer_lots": args["asset_transfer_lots"],
        }
    )
    data = identifier + encoded_args
    return TransactionInstruction(keys, PROGRAM_ID, data)
