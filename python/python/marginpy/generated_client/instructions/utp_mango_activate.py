from __future__ import annotations

import typing

import borsh_construct as borsh
from anchorpy.borsh_extension import BorshPubkey
from solana.publickey import PublicKey
from solana.transaction import AccountMeta, TransactionInstruction

from ..program_id import PROGRAM_ID


class UtpMangoActivateArgs(typing.TypedDict):
    authority_seed: PublicKey
    authority_bump: int


layout = borsh.CStruct("authority_seed" / BorshPubkey, "authority_bump" / borsh.U8)


class UtpMangoActivateAccounts(typing.TypedDict):
    marginfi_account: PublicKey
    marginfi_group: PublicKey
    authority: PublicKey
    mango_authority: PublicKey
    mango_account: PublicKey
    mango_program: PublicKey
    mango_group: PublicKey
    system_program: PublicKey


def utp_mango_activate(
    args: UtpMangoActivateArgs,
    accounts: UtpMangoActivateAccounts,
    program_id: PublicKey = PROGRAM_ID,
    remaining_accounts: typing.Optional[typing.List[AccountMeta]] = None,
) -> TransactionInstruction:
    keys: list[AccountMeta] = [
        AccountMeta(
            pubkey=accounts["marginfi_account"], is_signer=False, is_writable=True
        ),
        AccountMeta(
            pubkey=accounts["marginfi_group"], is_signer=False, is_writable=False
        ),
        AccountMeta(pubkey=accounts["authority"], is_signer=True, is_writable=True),
        AccountMeta(
            pubkey=accounts["mango_authority"], is_signer=False, is_writable=True
        ),
        AccountMeta(
            pubkey=accounts["mango_account"], is_signer=False, is_writable=True
        ),
        AccountMeta(
            pubkey=accounts["mango_program"], is_signer=False, is_writable=False
        ),
        AccountMeta(pubkey=accounts["mango_group"], is_signer=False, is_writable=True),
        AccountMeta(
            pubkey=accounts["system_program"], is_signer=False, is_writable=False
        ),
    ]
    if remaining_accounts is not None:
        keys += remaining_accounts
    identifier = b"\xfd\x97x\xc7\x0c1\xf3B"
    encoded_args = layout.build(
        {
            "authority_seed": args["authority_seed"],
            "authority_bump": args["authority_bump"],
        }
    )
    data = identifier + encoded_args
    return TransactionInstruction(keys, program_id, data)
