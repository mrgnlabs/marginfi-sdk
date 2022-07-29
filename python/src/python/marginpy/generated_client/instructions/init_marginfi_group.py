from __future__ import annotations

import typing

import borsh_construct as borsh
from solana.publickey import PublicKey
from solana.transaction import AccountMeta, TransactionInstruction

from ..program_id import PROGRAM_ID


class InitMarginfiGroupArgs(typing.TypedDict):
    bank_authority_pda_bump: int
    insurance_vault_authority_pda_bump: int
    fee_vault_authority_pda_bump: int


layout = borsh.CStruct(
    "bank_authority_pda_bump" / borsh.U8,
    "insurance_vault_authority_pda_bump" / borsh.U8,
    "fee_vault_authority_pda_bump" / borsh.U8,
)


class InitMarginfiGroupAccounts(typing.TypedDict):
    marginfi_group: PublicKey
    admin: PublicKey
    collateral_mint: PublicKey
    bank_vault: PublicKey
    bank_authority: PublicKey
    insurance_vault: PublicKey
    insurance_vault_authority: PublicKey
    fee_vault: PublicKey
    fee_vault_authority: PublicKey
    system_program: PublicKey


def init_marginfi_group(
    args: InitMarginfiGroupArgs,
    accounts: InitMarginfiGroupAccounts,
    program_id: PublicKey = PROGRAM_ID,
    remaining_accounts: typing.Optional[typing.List[AccountMeta]] = None,
) -> TransactionInstruction:
    keys: list[AccountMeta] = [
        AccountMeta(
            pubkey=accounts["marginfi_group"], is_signer=False, is_writable=True
        ),
        AccountMeta(pubkey=accounts["admin"], is_signer=True, is_writable=True),
        AccountMeta(
            pubkey=accounts["collateral_mint"], is_signer=False, is_writable=False
        ),
        AccountMeta(pubkey=accounts["bank_vault"], is_signer=False, is_writable=False),
        AccountMeta(
            pubkey=accounts["bank_authority"], is_signer=False, is_writable=False
        ),
        AccountMeta(
            pubkey=accounts["insurance_vault"], is_signer=False, is_writable=False
        ),
        AccountMeta(
            pubkey=accounts["insurance_vault_authority"],
            is_signer=False,
            is_writable=False,
        ),
        AccountMeta(pubkey=accounts["fee_vault"], is_signer=False, is_writable=False),
        AccountMeta(
            pubkey=accounts["fee_vault_authority"], is_signer=False, is_writable=False
        ),
        AccountMeta(
            pubkey=accounts["system_program"], is_signer=False, is_writable=False
        ),
    ]
    if remaining_accounts is not None:
        keys += remaining_accounts
    identifier = b"G*8\xc2\t\xb4\xae\xa3"
    encoded_args = layout.build(
        {
            "bank_authority_pda_bump": args["bank_authority_pda_bump"],
            "insurance_vault_authority_pda_bump": args[
                "insurance_vault_authority_pda_bump"
            ],
            "fee_vault_authority_pda_bump": args["fee_vault_authority_pda_bump"],
        }
    )
    data = identifier + encoded_args
    return TransactionInstruction(keys, program_id, data)
