from __future__ import annotations

import typing

import borsh_construct as borsh
from anchorpy.borsh_extension import BorshPubkey
from solana.publickey import PublicKey
from solana.transaction import AccountMeta, TransactionInstruction

from ..program_id import PROGRAM_ID


class UtpZoActivateArgs(typing.TypedDict):
    authority_seed: PublicKey
    authority_bump: int
    zo_margin_nonce: int


layout = borsh.CStruct(
    "authority_seed" / BorshPubkey,
    "authority_bump" / borsh.U8,
    "zo_margin_nonce" / borsh.U8,
)


class UtpZoActivateAccounts(typing.TypedDict):
    marginfi_account: PublicKey
    marginfi_group: PublicKey
    authority: PublicKey
    utp_authority: PublicKey
    zo_program: PublicKey
    zo_state: PublicKey
    zo_margin: PublicKey
    zo_control: PublicKey
    rent: PublicKey
    system_program: PublicKey


def utp_zo_activate(
    args: UtpZoActivateArgs,
    accounts: UtpZoActivateAccounts,
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
            pubkey=accounts["utp_authority"], is_signer=False, is_writable=False
        ),
        AccountMeta(pubkey=accounts["zo_program"], is_signer=False, is_writable=False),
        AccountMeta(pubkey=accounts["zo_state"], is_signer=False, is_writable=False),
        AccountMeta(pubkey=accounts["zo_margin"], is_signer=False, is_writable=True),
        AccountMeta(pubkey=accounts["zo_control"], is_signer=False, is_writable=True),
        AccountMeta(pubkey=accounts["rent"], is_signer=False, is_writable=False),
        AccountMeta(
            pubkey=accounts["system_program"], is_signer=False, is_writable=False
        ),
    ]
    if remaining_accounts is not None:
        keys += remaining_accounts
    identifier = b"\x90\x90c\xf9`\xe1T\xec"
    encoded_args = layout.build(
        {
            "authority_seed": args["authority_seed"],
            "authority_bump": args["authority_bump"],
            "zo_margin_nonce": args["zo_margin_nonce"],
        }
    )
    data = identifier + encoded_args
    return TransactionInstruction(keys, program_id, data)
