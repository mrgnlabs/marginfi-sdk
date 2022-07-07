from __future__ import annotations
import typing
from solana.publickey import PublicKey
from solana.transaction import TransactionInstruction, AccountMeta
import borsh_construct as borsh
from ..program_id import PROGRAM_ID


class UtpMangoUseCancelPerpOrderArgs(typing.TypedDict):
    order_id: int
    invalid_id_ok: bool


layout = borsh.CStruct("order_id" / borsh.I128, "invalid_id_ok" / borsh.Bool)


class UtpMangoUseCancelPerpOrderAccounts(typing.TypedDict):
    marginfi_account: PublicKey
    marginfi_group: PublicKey
    authority: PublicKey
    mango_authority: PublicKey
    mango_account: PublicKey
    mango_program: PublicKey
    mango_group: PublicKey
    mango_perp_market: PublicKey
    mango_bids: PublicKey
    mango_asks: PublicKey


def utp_mango_use_cancel_perp_order(
    args: UtpMangoUseCancelPerpOrderArgs, accounts: UtpMangoUseCancelPerpOrderAccounts
) -> TransactionInstruction:
    keys: list[AccountMeta] = [
        AccountMeta(
            pubkey=accounts["marginfi_account"], is_signer=False, is_writable=False
        ),
        AccountMeta(
            pubkey=accounts["marginfi_group"], is_signer=False, is_writable=False
        ),
        AccountMeta(pubkey=accounts["authority"], is_signer=True, is_writable=True),
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
        AccountMeta(
            pubkey=accounts["mango_perp_market"], is_signer=False, is_writable=True
        ),
        AccountMeta(pubkey=accounts["mango_bids"], is_signer=False, is_writable=True),
        AccountMeta(pubkey=accounts["mango_asks"], is_signer=False, is_writable=True),
    ]
    identifier = b"Uc\xbd)\xdd.\x8f\xe5"
    encoded_args = layout.build(
        {
            "order_id": args["order_id"],
            "invalid_id_ok": args["invalid_id_ok"],
        }
    )
    data = identifier + encoded_args
    return TransactionInstruction(keys, PROGRAM_ID, data)
