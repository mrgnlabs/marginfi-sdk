from __future__ import annotations
import typing
from solana.publickey import PublicKey
from solana.transaction import TransactionInstruction, AccountMeta
import borsh_construct as borsh
from ..program_id import PROGRAM_ID


class LiquidateSpotPositionArgs(typing.TypedDict):
    asset_transfer_amount: int


layout = borsh.CStruct("asset_transfer_amount" / borsh.I64)


class LiquidateSpotPositionAccounts(typing.TypedDict):
    state: PublicKey
    cache: PublicKey
    liqor: PublicKey
    liqor_margin: PublicKey
    liqor_control: PublicKey
    liqee_margin: PublicKey
    liqee_control: PublicKey
    asset_mint: PublicKey
    quote_mint: PublicKey


def liquidate_spot_position(
    args: LiquidateSpotPositionArgs, accounts: LiquidateSpotPositionAccounts
) -> TransactionInstruction:
    keys: list[AccountMeta] = [
        AccountMeta(pubkey=accounts["state"], is_signer=False, is_writable=False),
        AccountMeta(pubkey=accounts["cache"], is_signer=False, is_writable=True),
        AccountMeta(pubkey=accounts["liqor"], is_signer=True, is_writable=False),
        AccountMeta(pubkey=accounts["liqor_margin"], is_signer=False, is_writable=True),
        AccountMeta(
            pubkey=accounts["liqor_control"], is_signer=False, is_writable=True
        ),
        AccountMeta(pubkey=accounts["liqee_margin"], is_signer=False, is_writable=True),
        AccountMeta(
            pubkey=accounts["liqee_control"], is_signer=False, is_writable=True
        ),
        AccountMeta(pubkey=accounts["asset_mint"], is_signer=False, is_writable=False),
        AccountMeta(pubkey=accounts["quote_mint"], is_signer=False, is_writable=False),
    ]
    identifier = b"\xf4\x01\x9b\xd3$q<\xbd"
    encoded_args = layout.build(
        {
            "asset_transfer_amount": args["asset_transfer_amount"],
        }
    )
    data = identifier + encoded_args
    return TransactionInstruction(keys, PROGRAM_ID, data)
