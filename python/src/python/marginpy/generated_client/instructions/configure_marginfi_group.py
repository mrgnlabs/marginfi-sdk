from __future__ import annotations

import typing

import borsh_construct as borsh
from solana.publickey import PublicKey
from solana.transaction import AccountMeta, TransactionInstruction

from .. import types
from ..program_id import PROGRAM_ID


class ConfigureMarginfiGroupArgs(typing.TypedDict):
    config_arg: types.group_config.GroupConfig


layout = borsh.CStruct("config_arg" / types.group_config.GroupConfig.layout)


class ConfigureMarginfiGroupAccounts(typing.TypedDict):
    marginfi_group: PublicKey
    admin: PublicKey


def configure_marginfi_group(
    args: ConfigureMarginfiGroupArgs,
    accounts: ConfigureMarginfiGroupAccounts,
    program_id: PublicKey = PROGRAM_ID,
    remaining_accounts: typing.Optional[typing.List[AccountMeta]] = None,
) -> TransactionInstruction:
    keys: list[AccountMeta] = [
        AccountMeta(
            pubkey=accounts["marginfi_group"], is_signer=False, is_writable=True
        ),
        AccountMeta(pubkey=accounts["admin"], is_signer=True, is_writable=False),
    ]
    if remaining_accounts is not None:
        keys += remaining_accounts
    identifier = b"\r\x1ag\x9d\x05\x19\xa9{"
    encoded_args = layout.build(
        {
            "config_arg": args["config_arg"].to_encodable(),
        }
    )
    data = identifier + encoded_args
    return TransactionInstruction(keys, program_id, data)
