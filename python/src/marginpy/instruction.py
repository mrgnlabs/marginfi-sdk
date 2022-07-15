from dataclasses import dataclass
from typing import List
from solana.publickey import PublicKey
from solana.system_program import SYS_PROGRAM_ID
from solana.transaction import AccountMeta, TransactionInstruction
from spl.token.constants import TOKEN_PROGRAM_ID
import marginpy.generated_client.instructions as gen_ix


# --- Init MarginfiGroup
class InitMarginfiGroupArgs(gen_ix.InitMarginfiGroupArgs):
    pass


@dataclass
class InitMarginfiGroupAccounts:
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
        args: gen_ix.InitMarginfiGroupArgs,
        accounts: InitMarginfiGroupAccounts
) -> TransactionInstruction:
    return gen_ix.init_marginfi_group(
        args,
        gen_ix.InitMarginfiGroupAccounts(
            marginfi_group=accounts.marginfi_group_pk,
            admin=accounts.admin_pk,
            collateral_mint=accounts.mint_pk,
            bank_vault=accounts.bank_vault_pk,
            bank_authority=accounts.bank_authority_pk,
            insurance_vault=accounts.insurance_vault,
            insurance_vault_authority=accounts.insurance_vault_authority,
            fee_vault=accounts.fee_vault,
            fee_vault_authority=accounts.fee_vault_authority,
            system_program=SYS_PROGRAM_ID
        )
    )


# --- Configure MarginfiGroup
class ConfigureMarginfiGroupArgs(gen_ix.ConfigureMarginfiGroupArgs):
    pass


class ConfigureMarginfiGroupAccounts(gen_ix.ConfigureMarginfiGroupAccounts):
    pass


def make_configure_marginfi_group_ix(
        args: ConfigureMarginfiGroupArgs,
        accounts: ConfigureMarginfiGroupAccounts
):
    return gen_ix.configure_marginfi_group(args, accounts)


# --- Init GMA
@dataclass
class InitMarginfiAccountAccounts:
    marginfi_group: PublicKey
    marginfi_account: PublicKey
    authority: PublicKey


def make_init_marginfi_account_ix(accounts: InitMarginfiAccountAccounts):
    return gen_ix.init_marginfi_account(
        gen_ix.InitMarginfiAccountAccounts(
            marginfi_group=accounts.marginfi_group,
            marginfi_account=accounts.marginfi_account,
            authority=accounts.authority,
            system_program=SYS_PROGRAM_ID
        )
    )


# --- Deposit to GMA
class DepositArgs(gen_ix.MarginDepositCollateralArgs):
    pass


@dataclass
class DepositAccounts:
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
    ix = gen_ix.margin_deposit_collateral(
        args,
        gen_ix.MarginDepositCollateralAccounts(
            marginfi_group=accounts.marginfi_group,
            marginfi_account=accounts.marginfi_account,
            signer=accounts.authority,
            funding_account=accounts.funding_account,
            token_vault=accounts.bank_vault,
            token_program=TOKEN_PROGRAM_ID
        ),
    )
    ix.keys.extend(remaining_accounts)
    return ix


# --- Withdraw from GMA
class WithdrawArgs(gen_ix.MarginWithdrawCollateralArgs):
    pass


@dataclass
class WithdrawAccounts:
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
    ix = gen_ix.margin_withdraw_collateral(
        args,
        gen_ix.MarginWithdrawCollateralAccounts(
            marginfi_group=accounts.marginfi_group_pk,
            marginfi_account=accounts.marginfi_account_pk,
            signer=accounts.authority_pk,
            margin_collateral_vault=accounts.bank_vault_pk,
            margin_bank_authority=accounts.bank_vault_authority_pk,
            receiving_token_account=accounts.receiving_token_account,
            token_program=TOKEN_PROGRAM_ID
        )
    )
    ix.keys.extend(remaining_accounts)
    return ix


# --- Update interest accumulator
@dataclass
class UpdateInterestAccumulatorAccounts:
    marginfi_group: PublicKey
    bank_vault: PublicKey
    bank_authority: PublicKey
    bank_fee_vault: PublicKey


def make_update_interest_accumulator_ix(
        accounts: UpdateInterestAccumulatorAccounts
):
    return gen_ix.update_interest_accumulator(
        gen_ix.UpdateInterestAccumulatorAccounts(
            marginfi_group=accounts.marginfi_group,
            bank_vault=accounts.bank_vault,
            bank_authority=accounts.bank_authority,
            bank_fee_vault=accounts.bank_fee_vault,
            token_program=TOKEN_PROGRAM_ID
        )
    )


# --- Deactivate UTP
class DeactivateUtpArgs(gen_ix.DeactivateUtpArgs):
    pass


class DeactivateUtpAccounts(gen_ix.DeactivateUtpAccounts):
    pass


def make_deactivate_utp_ix(
        args: DeactivateUtpArgs,
        accounts: DeactivateUtpAccounts,
        remaining_accounts: List[AccountMeta]
):
    ix = gen_ix.deactivate_utp(args, accounts)
    ix.keys.extend(remaining_accounts)
    return ix


# --- Liquidate
class LiquidateArgs(gen_ix.LiquidateArgs):
    pass


@dataclass
class LiquidateAccounts:
    marginfi_account: PublicKey
    marginfi_account_liquidatee: PublicKey
    marginfi_group: PublicKey
    bank_vault: PublicKey
    bank_authority: PublicKey
    bank_insurance_vault: PublicKey
    signer: PublicKey


def make_liquidate_ix(
        args: gen_ix.LiquidateArgs,
        accounts: LiquidateAccounts,
        remaining_accounts: List[AccountMeta]
):
    ix = gen_ix.liquidate(
        args,
        gen_ix.LiquidateAccounts(
            marginfi_account=accounts.marginfi_account,
            marginfi_account_liquidatee=accounts.marginfi_account_liquidatee,
            marginfi_group=accounts.marginfi_group,
            bank_vault=accounts.bank_vault,
            bank_authority=accounts.bank_authority,
            bank_insurance_vault=accounts.bank_insurance_vault,
            signer=accounts.signer,
            token_program=TOKEN_PROGRAM_ID,
        )
    )
    ix.keys.extend(remaining_accounts)
    return ix


# --- Handle bankruptcy
@dataclass
class HandleBankruptcyAccounts:
    marginfi_account: PublicKey
    marginfi_group: PublicKey
    insurance_vault: PublicKey
    insurance_vault_authority: PublicKey
    liquidity_vault: PublicKey


def make_handle_bankruptcy_ix(
        accounts: HandleBankruptcyAccounts,
        remaining_accounts: List[AccountMeta]
):
    ix = gen_ix.handle_bankruptcy(
        gen_ix.HandleBankruptcyAccounts(
            marginfi_account=accounts.marginfi_account,
            marginfi_group=accounts.marginfi_group,
            insurance_vault=accounts.insurance_vault,
            insurance_vault_authority=accounts.insurance_vault_authority,
            liquidity_vault=accounts.liquidity_vault,
            token_program=TOKEN_PROGRAM_ID,
        )
    )
    ix.keys.extend(remaining_accounts)
    return ix
