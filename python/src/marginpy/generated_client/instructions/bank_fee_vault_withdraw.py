from __future__ import annotations
import typing
from solana.publickey import PublicKey
from solana.transaction import TransactionInstruction, AccountMeta
import borsh_construct as borsh
from ..program_id import PROGRAM_ID


class BankFeeVaultWithdrawArgs(typing.TypedDict):
    amount: int


layout = borsh.CStruct("amount" / borsh.U64)


class BankFeeVaultWithdrawAccounts(typing.TypedDict):
    marginfi_group: PublicKey
    admin: PublicKey
    bank_fee_vault: PublicKey
    bank_fee_vault_authority: PublicKey
    recipient_token_account: PublicKey
    token_program: PublicKey


def bank_fee_vault_withdraw(
    args: BankFeeVaultWithdrawArgs, accounts: BankFeeVaultWithdrawAccounts
) -> TransactionInstruction:
    keys: list[AccountMeta] = [
        AccountMeta(
            pubkey=accounts["marginfi_group"], is_signer=False, is_writable=True
        ),
        AccountMeta(pubkey=accounts["admin"], is_signer=True, is_writable=False),
        AccountMeta(
            pubkey=accounts["bank_fee_vault"], is_signer=False, is_writable=True
        ),
        AccountMeta(
            pubkey=accounts["bank_fee_vault_authority"],
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
    identifier = b"v\x18\x85\x19\x1bs\xac\xb0"
    encoded_args = layout.build(
        {
            "amount": args["amount"],
        }
    )
    data = identifier + encoded_args
    return TransactionInstruction(keys, PROGRAM_ID, data)
