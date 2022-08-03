from dataclasses import dataclass
from typing import List, Optional

import marginpy.generated_client.instructions as gen_ix
from solana.publickey import PublicKey
from solana.system_program import SYS_PROGRAM_ID
from solana.transaction import AccountMeta, TransactionInstruction
from spl.token.constants import TOKEN_PROGRAM_ID


# --- Init MarginfiGroup
class InitMarginfiGroupArgs(gen_ix.InitMarginfiGroupArgs):
    pass


@dataclass
class InitMarginfiGroupAccounts:
    marginfi_group: PublicKey
    admin: PublicKey
    mint: PublicKey
    bank_vault: PublicKey
    bank_authority: PublicKey
    insurance_vault: PublicKey
    insurance_vault_authority: PublicKey
    fee_vault: PublicKey
    fee_vault_authority: PublicKey


def make_init_marginfi_group_ix(
    args: gen_ix.InitMarginfiGroupArgs,
    accounts: InitMarginfiGroupAccounts,
    program_id: PublicKey,
    remaining_accounts: Optional[List[AccountMeta]] = None,
) -> TransactionInstruction:
    return gen_ix.init_marginfi_group(
        args,
        gen_ix.InitMarginfiGroupAccounts(
            marginfi_group=accounts.marginfi_group,
            admin=accounts.admin,
            collateral_mint=accounts.mint,
            bank_vault=accounts.bank_vault,
            bank_authority=accounts.bank_authority,
            insurance_vault=accounts.insurance_vault,
            insurance_vault_authority=accounts.insurance_vault_authority,
            fee_vault=accounts.fee_vault,
            fee_vault_authority=accounts.fee_vault_authority,
            system_program=SYS_PROGRAM_ID,
        ),
        program_id=program_id,
        remaining_accounts=remaining_accounts,
    )


# --- Configure MarginfiGroup
class ConfigureMarginfiGroupArgs(gen_ix.ConfigureMarginfiGroupArgs):
    pass


class ConfigureMarginfiGroupAccounts(gen_ix.ConfigureMarginfiGroupAccounts):
    pass


def make_configure_marginfi_group_ix(
    args: ConfigureMarginfiGroupArgs,
    accounts: ConfigureMarginfiGroupAccounts,
    program_id: PublicKey,
    remaining_accounts: Optional[List[AccountMeta]] = None,
):
    return gen_ix.configure_marginfi_group(
        args,
        accounts,
        program_id=program_id,
        remaining_accounts=remaining_accounts,
    )


# --- Init GMA
@dataclass
class InitMarginfiAccountAccounts:
    marginfi_group: PublicKey
    marginfi_account: PublicKey
    authority: PublicKey


def make_init_marginfi_account_ix(
    accounts: InitMarginfiAccountAccounts,
    program_id: PublicKey,
    remaining_accounts: Optional[List[AccountMeta]] = None,
):
    return gen_ix.init_marginfi_account(
        gen_ix.InitMarginfiAccountAccounts(
            marginfi_group=accounts.marginfi_group,
            marginfi_account=accounts.marginfi_account,
            authority=accounts.authority,
            system_program=SYS_PROGRAM_ID,
        ),
        program_id=program_id,
        remaining_accounts=remaining_accounts,
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
    program_id: PublicKey,
    remaining_accounts: Optional[List[AccountMeta]] = None,
) -> TransactionInstruction:
    return gen_ix.margin_deposit_collateral(
        args,
        gen_ix.MarginDepositCollateralAccounts(
            marginfi_group=accounts.marginfi_group,
            marginfi_account=accounts.marginfi_account,
            signer=accounts.authority,
            funding_account=accounts.funding_account,
            token_vault=accounts.bank_vault,
            token_program=TOKEN_PROGRAM_ID,
        ),
        program_id=program_id,
        remaining_accounts=remaining_accounts,
    )


# --- Withdraw from GMA
class WithdrawArgs(gen_ix.MarginWithdrawCollateralArgs):
    pass


@dataclass
class WithdrawAccounts:
    marginfi_group: PublicKey
    marginfi_account: PublicKey
    authority: PublicKey
    bank_vault: PublicKey
    bank_vault_authority: PublicKey
    receiving_token_account: PublicKey


def make_withdraw_ix(
    args: WithdrawArgs,
    accounts: WithdrawAccounts,
    program_id: PublicKey,
    remaining_accounts: Optional[List[AccountMeta]] = None,
):
    return gen_ix.margin_withdraw_collateral(
        args,
        gen_ix.MarginWithdrawCollateralAccounts(
            marginfi_group=accounts.marginfi_group,
            marginfi_account=accounts.marginfi_account,
            signer=accounts.authority,
            margin_collateral_vault=accounts.bank_vault,
            margin_bank_authority=accounts.bank_vault_authority,
            receiving_token_account=accounts.receiving_token_account,
            token_program=TOKEN_PROGRAM_ID,
        ),
        program_id=program_id,
        remaining_accounts=remaining_accounts,
    )


# --- Update interest accumulator
@dataclass
class UpdateInterestAccumulatorAccounts:
    marginfi_group: PublicKey
    bank_vault: PublicKey
    bank_authority: PublicKey
    bank_fee_vault: PublicKey


def make_update_interest_accumulator_ix(
    accounts: UpdateInterestAccumulatorAccounts,
    program_id: PublicKey,
    remaining_accounts: Optional[List[AccountMeta]] = None,
):
    return gen_ix.update_interest_accumulator(
        gen_ix.UpdateInterestAccumulatorAccounts(
            marginfi_group=accounts.marginfi_group,
            bank_vault=accounts.bank_vault,
            bank_authority=accounts.bank_authority,
            bank_fee_vault=accounts.bank_fee_vault,
            token_program=TOKEN_PROGRAM_ID,
        ),
        program_id=program_id,
        remaining_accounts=remaining_accounts,
    )


# --- Deactivate UTP
class DeactivateUtpArgs(gen_ix.DeactivateUtpArgs):
    pass


class DeactivateUtpAccounts(gen_ix.DeactivateUtpAccounts):
    pass


def make_deactivate_utp_ix(
    args: DeactivateUtpArgs,
    accounts: DeactivateUtpAccounts,
    program_id: PublicKey,
    remaining_accounts: Optional[List[AccountMeta]] = None,
):
    return gen_ix.deactivate_utp(
        args, accounts, program_id=program_id, remaining_accounts=remaining_accounts
    )


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
    program_id: PublicKey,
    remaining_accounts: Optional[List[AccountMeta]] = None,
):
    return gen_ix.liquidate(
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
        ),
        program_id=program_id,
        remaining_accounts=remaining_accounts,
    )


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
    program_id: PublicKey,
    remaining_accounts: Optional[List[AccountMeta]] = None,
):
    return gen_ix.handle_bankruptcy(
        gen_ix.HandleBankruptcyAccounts(
            marginfi_account=accounts.marginfi_account,
            marginfi_group=accounts.marginfi_group,
            insurance_vault=accounts.insurance_vault,
            insurance_vault_authority=accounts.insurance_vault_authority,
            liquidity_vault=accounts.liquidity_vault,
            token_program=TOKEN_PROGRAM_ID,
        ),
        program_id=program_id,
        remaining_accounts=remaining_accounts,
    )
