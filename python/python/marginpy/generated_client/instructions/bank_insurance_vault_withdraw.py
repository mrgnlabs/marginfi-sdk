from __future__ import annotations

import typing

import borsh_construct as borsh
from solana.publickey import PublicKey
from solana.transaction import AccountMeta, TransactionInstruction

from ..program_id import PROGRAM_ID


class BankInsuranceVaultWithdrawArgs(typing.TypedDict):
    amount: int


layout = borsh.CStruct("amount" / borsh.U64)


class BankInsuranceVaultWithdrawAccounts(typing.TypedDict):
    marginfi_group: PublicKey
    admin: PublicKey
    insurance_vault: PublicKey
    insurance_vault_authority: PublicKey
    recipient_token_account: PublicKey
    token_program: PublicKey


def bank_insurance_vault_withdraw(
    args: BankInsuranceVaultWithdrawArgs,
    accounts: BankInsuranceVaultWithdrawAccounts,
    program_id: PublicKey = PROGRAM_ID,
    remaining_accounts: typing.Optional[typing.List[AccountMeta]] = None,
) -> TransactionInstruction:
    keys: list[AccountMeta] = [
        AccountMeta(
            pubkey=accounts["marginfi_group"], is_signer=False, is_writable=True
        ),
        AccountMeta(pubkey=accounts["admin"], is_signer=True, is_writable=False),
        AccountMeta(
            pubkey=accounts["insurance_vault"], is_signer=False, is_writable=True
        ),
        AccountMeta(
            pubkey=accounts["insurance_vault_authority"],
            is_signer=False,
            is_writable=False,
        ),
        AccountMeta(
            pubkey=accounts["recipient_token_account"],
            is_signer=False,
            is_writable=True,
        ),
        AccountMeta(
            pubkey=accounts["token_program"], is_signer=False, is_writable=False
        ),
    ]
    if remaining_accounts is not None:
        keys += remaining_accounts
    identifier = b'"\x98\xb9\xa0X\x99\x1a\t'
    encoded_args = layout.build(
        {
            "amount": args["amount"],
        }
    )
    data = identifier + encoded_args
    return TransactionInstruction(keys, program_id, data)
