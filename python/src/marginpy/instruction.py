from re import M
from typing import Type, TypedDict, List

from solana.publickey import PublicKey
from solana.system_program import SYS_PROGRAM_ID
from solana.transaction import AccountMeta, TransactionInstruction
from spl.token.constants import TOKEN_PROGRAM_ID

from marginpy.generated_client.instructions import init_marginfi_group, \
    configure_marginfi_group, \
    deactivate_utp, \
    handle_bankruptcy, \
    init_marginfi_account, \
    liquidate, \
    margin_deposit_collateral, \
    margin_withdraw_collateral, \
    update_interest_accumulator
from marginpy.generated_client.types import GroupConfig
from marginpy.utils import UtpIndex

# --- Init MarginfiGroup


class InitMarginfiGroupArgs(TypedDict):
    bank_authority_pda_bump: int
    insurance_vault_authority_pda_bump: int
    fee_vault_authority_pda_bump: int


class InitMarginfiGroupAccounts(TypedDict):
    marginfi_group_pk: PublicKey
    admin_pk: PublicKey
    mint_pk: PublicKey
    bank_vault_pk: PublicKey
    bank_authority_pk: PublicKey
    insurance_vault: PublicKey
    insurance_vault_authority: PublicKey
    fee_vault: PublicKey
    fee_vault_authority: PublicKey


def make_init_marginfi_group_ix(
    args: InitMarginfiGroupArgs,
    accounts: InitMarginfiGroupAccounts
) -> TransactionInstruction:
    return init_marginfi_group(
        {
            "bank_authority_pda_bump": args["bank_authority_pda_bump"],
            "insurance_vault_authority_pda_bump": args["insurance_vault_authority_pda_bump"],
            "fee_vault_authority_pda_bump": args["fee_vault_authority_pda_bump"]
        },
        {
            "marginfi_group": accounts["marginfi_group_pk"],
            "admin": accounts["admin_pk"],
            "collateral_mint": accounts["mint_pk"],
            "bank_vault": accounts["bank_vault_pk"],
            "bank_authority": accounts["bank_authority_pk"],
            "insurance_vault": accounts["insurance_vault"],
            "insurance_vault_authority": accounts["insurance_vault_authority"],
            "fee_vault": accounts["fee_vault"],
            "fee_vault_authority": accounts["fee_vault_authority"],
            "system_program": SYS_PROGRAM_ID
        }
    )


# --- Configure MarginfiGroup


class ConfigureMarginfiGroupArgs(TypedDict):
    args: GroupConfig

class ConfigureMarginfiGroupAccounts(TypedDict):
    marginfi_group_pk: PublicKey
    admin_pk: PublicKey

def make_configure_marginfi_group_ix(
    args: ConfigureMarginfiGroupArgs,
    accounts: ConfigureMarginfiGroupAccounts
):
    bank = {
        "scaling_factor_c": args["args"]["bank"]["scaling_factor_c"],
        "fixed_fee": args["args"]["bank"]["fixed_fee"],
        "interest_fee": args["args"]["bank"]["interest_fee"],
        "maint_margin_ratio": args["args"]["bank"]["maint_margin_ratio"],
        "init_margin_fatio": args["args"]["bank"]["init_margin_ratio"],
        "account_deposit_limit": args["args"]["bank"]["account_deposit_limit"],
        "lp_deposit_limit": args["args"]["bank"]["lp_deposit_limit"],
    } if type(args.args.bank) == 'dict' else {
        "scaling_factor_c": None,
        "fixed_fee": None,
        "interest_fee": None,
        "maint_margin_ratio": None,
        "init_margin_fatio": None,
        "account_deposit_limit": None,
        "lp_deposit_limit": None
    }

    return configure_marginfi_group(
        {
            "admin": args.args.admin if args.args is None else None,
            "bank": bank,
            "paused": args.args.paused if args.args.paused is not None else None
        },
        {
            "marginfi_group": accounts["marginfi_group_pk"],
            "admin": accounts["admin_pk"],
        }
    )


# --- Init GMA


class InitMarginfiAccountAccounts(TypedDict):
    marginfi_group: PublicKey
    marginfi_account: PublicKey
    authority: PublicKey


def make_init_marginfi_account_ix(
        accounts: InitMarginfiAccountAccounts
):
    return init_marginfi_account({
        "marginfi_group": accounts["marginfi_group"],
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
    ix = margin_deposit_collateral(
        {
            "amount": args["amount"]
        },
        {
            "marginfi_group": accounts["marginfi_group"],
            "marginfi_account": accounts["marginfi_account"],
            "signer": accounts["authority"],
            "funding_account": accounts["funding_account"],
            "token_vault": accounts["bank_vault"],
            "token_program": TOKEN_PROGRAM_ID
        },
    )
    
    ix.keys.extend(remaining_accounts)
    return ix

# --- Withdraw from GMA


class WithdrawArgs(TypedDict):
    amount: int


class WithdrawAccounts(TypedDict):
    marginfi_group_pk: PublicKey
    marginfi_account_pk: PublicKey
    authority_pk: PublicKey
    bank_vault_pk: PublicKey
    bank_vault_authority_pk: PublicKey
    receiving_token_account: PublicKey


def make_withdraw_ix(
    args: WithdrawArgs,
    accounts: WithdrawAccounts,
    remaining_accounts: List[AccountMeta]
):
    ix = margin_withdraw_collateral(
        {
            "amount": args["amount"]
        },
        {
            "marginfi_group": accounts["marginfi_group_pk"],
            "marginfi_account": accounts["marginfi_account_pk"],
            "signer": accounts["authority_pk"],
            "margin_collateral_vault": accounts["bank_vault_pk"],
            "margin_bank_authority": accounts["bank_vault_authority_pk"],
            "receiving_token_account": accounts["receiving_token_account"],
            "token_program": TOKEN_PROGRAM_ID
        }
    )
    ix.keys.extend(remaining_accounts)
    return ix


# --- Update interest accumulator


class UpdateInterestAccumulatorAccounts(TypedDict):
    marginfi_group_pk: PublicKey
    bank_vault: PublicKey
    bank_authority: PublicKey
    bank_fee_vault: PublicKey


def make_update_interest_accumulator_ix(
    accounts: UpdateInterestAccumulatorAccounts
):
    return update_interest_accumulator(
        {
            "marginfi_group": accounts["marginfi_group_pk"],
            "bank_vault": accounts["bank_vault"],
            "bank_authority": accounts["bank_authority"],
            "bank_fee_vault": accounts["bank_fee_vault"],
            "token_program": TOKEN_PROGRAM_ID
        }
    )


# --- Deactivate UTP


class DeactivateUtpArgs(TypedDict):
    utp_index: UtpIndex


class DeactivateUtpAccounts(TypedDict):
    marginfi_account_pk: PublicKey
    authority_pk: PublicKey


def make_deactivate_utp_ix(
    args: DeactivateUtpArgs,
    accounts: DeactivateUtpAccounts,
    remaining_accounts: List[AccountMeta]
):
    ix = deactivate_utp(
        {
            "utp_index": int(args["utp_index"]), #@todo confirm this converts correctly
        },
        {
            "marginfi_account": accounts["marginfi_account_pk"],
            "authority": accounts["authority_pk"]
        }
    )
    ix.keys.extend(remaining_accounts)
    return ix


# --- Liquidate


class LiquidateArgs(TypedDict):
    utp_index: UtpIndex


class LiquidateAccounts(TypedDict):
    marginfi_account_pk: PublicKey
    marginfi_account_liquidate_pk: PublicKey
    marginfi_group_pk: PublicKey
    bank_vault: PublicKey
    bank_authority: PublicKey
    bank_insurance_vault: PublicKey
    signer_pk: PublicKey


def make_liquidate_ix(
    args: LiquidateArgs,
    accounts: LiquidateAccounts,
    remaining_accounts: List[AccountMeta]
):
    ix = liquidate(
        {
            "utp_index": int(args["utp_index"]), #@todo confirm this converts correctly
        },
        {
            "marginfi_account": accounts["marginfi_account_pk"],
            "marginfi_account_liquidate": accounts["marginfi_account_liquidate_pk"],
            "marginfi_group": accounts["marginfi_group_pk"],
            "bank_vault": accounts["bank_vault"],
            "bank_authority": accounts["bank_authority"],
            "bank_insurance_vault": accounts["bank_insurance_vault"],
            "signer": accounts["signer_pk"],
            "token_program": TOKEN_PROGRAM_ID
        }
    )
    ix.keys.extend(remaining_accounts)
    return ix


# --- Handle bankruptcy


class HandleBankruptcyAccounts(TypedDict):
    marginfi_account_pk: PublicKey
    marginfi_group_pk: PublicKey
    insurance_vault_pk: PublicKey
    insurance_vault_authority_pk: PublicKey
    liquidity_vault_pk: PublicKey


def make_handle_bankruptcy_ix(
    accounts: HandleBankruptcyAccounts,
    remaining_accounts: List[AccountMeta]
):
    ix = handle_bankruptcy(
        {
            "marginfi_account": accounts["marginfi_account_pk"],
            "marginfi_group": accounts["marginfi_group_pk"],
            "insurance_vault": accounts["insurance_vault_pk"],
            "insurance_vault_authority": accounts["insurance_vault_authority_pk"],
            "liquidity_vault": accounts["liquidity_vault_pk"],
            "token_program": TOKEN_PROGRAM_ID
        }
    )
    ix.keys.extend(remaining_accounts)
    return ix
