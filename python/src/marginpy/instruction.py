from typing import TypedDict, List

from solana.publickey import PublicKey
from solana.system_program import SYS_PROGRAM_ID
from solana.transaction import AccountMeta, TransactionInstruction
from spl.token.constants import TOKEN_PROGRAM_ID

from marginpy.generated_client.instructions import init_marginfi_account, \
    margin_deposit_collateral


# --- Init GMA


class InitMarginfiAccountAccounts(TypedDict):
    marginfi_group: PublicKey
    marginfi_account: PublicKey
    authority: PublicKey


def make_init_marginfi_account_ix(
        accounts: InitMarginfiAccountAccounts
):
    return init_marginfi_account({
        'marginfi_group': accounts["marginfi_group"],
        "marginfi_account": accounts["marginfi_account"],
        "authority": accounts["authority"],
        "system_program": SYS_PROGRAM_ID
    })


# --- Deposit to GMA


class DepositArgs(TypedDict):
    amount: int


class DepositAccounts(TypedDict):
    marginfi_account: PublicKey
    marginfi_group: PublicKey
    authority: PublicKey
    funding_account: PublicKey
    bank_vault: PublicKey


def make_deposit_ix(
        args: DepositArgs,
        accounts: DepositAccounts,
        remaining_accounts: List[AccountMeta]
) -> TransactionInstruction:
    ix = margin_deposit_collateral({"amount": args["amount"]},
                                   {'marginfi_group': accounts["marginfi_group"],
                                    "marginfi_account": accounts["marginfi_account"],
                                    "signer": accounts["authority"],
                                    "funding_account": accounts["funding_account"],
                                    "token_vault": accounts["bank_vault"],
                                    "token_program": TOKEN_PROGRAM_ID},
                                   )
    ix.keys.extend(remaining_accounts)
    return ix
