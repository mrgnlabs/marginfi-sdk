from __future__ import annotations
import typing
from solana.publickey import PublicKey
from solana.transaction import TransactionInstruction, AccountMeta
from ..program_id import PROGRAM_ID


class SettleBankruptcyAccounts(typing.TypedDict):
    state: PublicKey
    state_signer: PublicKey
    cache: PublicKey
    liqor: PublicKey
    liqor_margin: PublicKey
    liqor_control: PublicKey
    liqee_margin: PublicKey
    liqee_control: PublicKey
    asset_mint: PublicKey


def settle_bankruptcy(accounts: SettleBankruptcyAccounts) -> TransactionInstruction:
    keys: list[AccountMeta] = [
        AccountMeta(pubkey=accounts["state"], is_signer=False, is_writable=True),
        AccountMeta(pubkey=accounts["state_signer"], is_signer=False, is_writable=True),
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
    ]
    identifier = b"\xcf4imY\xfd\x18\x91"
    encoded_args = b""
    data = identifier + encoded_args
    return TransactionInstruction(keys, PROGRAM_ID, data)
