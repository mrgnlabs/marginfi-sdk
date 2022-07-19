from datetime import datetime

from solana.publickey import PublicKey
from marginpy.decimal import Decimal
from marginpy.generated_client.types import (
    Bank as BankDecoded,
    LendingSideKind,
    MarginRequirementKind,
)
from marginpy.generated_client.types.lending_side import Borrow, Deposit
from marginpy.generated_client.types.margin_requirement import Init, Maint


class Bank:
    scaling_factor_c: float
    fixed_fee: float
    interest_fee: float
    deposit_accumulator: float
    borrow_accumulator: float
    last_update: datetime
    native_deposit_balance: float
    native_borrow_balance: float
    mint: PublicKey
    vault: PublicKey
    vault_authority_pda_bump: int
    insurance_vault: PublicKey
    insurance_vault_authority_pda_bump: int
    fee_vault: PublicKey
    fee_vault_authority_pda_bump: int
    init_margin_ratio: float
    maint_margin_ratio: float
    account_deposit_limit: float
    lp_deposit_limit: float

    def __init__(self, data: BankDecoded) -> None:
        self.scaling_factor_c = Decimal.from_account_data(
            data.scaling_factor_c
        ).to_float()
        self.fixed_fee = Decimal.from_account_data(data.fixed_fee).to_float()
        self.interest_fee = Decimal.from_account_data(data.interest_fee).to_float()
        self.deposit_accumulator = Decimal.from_account_data(
            data.deposit_accumulator
        ).to_float()
        self.borrow_accumulator = Decimal.from_account_data(
            data.borrow_accumulator
        ).to_float()
        self.last_update = datetime.fromtimestamp(data.last_update)
        self.native_deposit_balance = Decimal.from_account_data(
            data.native_deposit_balance
        ).to_float()
        self.native_borrow_balance = Decimal.from_account_data(
            data.native_borrow_balance
        ).to_float()
        self.mint = data.mint
        self.vault = data.vault
        self.vault_authority_pda_bump = data.vault_authority_pda_bump
        self.insurance_vault = data.insurance_vault
        self.insurance_vault_authority_pda_bump = (
            data.insurance_vault_authority_pda_bump
        )
        self.insurance_vault_outstanding_transfers = (
            data.insurance_vault_outstanding_transfers
        )
        self.fee_vault = data.fee_vault
        self.fee_vault_authority_pda_bump = data.fee_vault_authority_pda_bump
        self.init_margin_ratio = Decimal.from_account_data(
            data.init_margin_ratio
        ).to_float()
        self.maint_margin_ratio = Decimal.from_account_data(
            data.maint_margin_ratio
        ).to_float()
        self.account_deposit_limit = Decimal.from_account_data(
            data.account_deposit_limit
        ).to_float()
        self.lp_deposit_limit = Decimal.from_account_data(
            data.lp_deposit_limit
        ).to_float()

    # @todo should we error on negative `record` values?
    def compute_native_amount(
        self,
        record: float,
        side: LendingSideKind,
    ):
        if side == Borrow:
            return record * self.borrow_accumulator
        elif side == Deposit:
            return record * self.deposit_accumulator
        else:
            raise Exception("Unknown lending side: {}".format(side))

    # @todo should we error on negative `record` values?
    def compute_record_amount(self, record: float, side: LendingSideKind):
        if side == Borrow:
            return record / self.borrow_accumulator
        elif side == Deposit:
            return record / self.deposit_accumulator
        else:
            raise Exception("Unknown lending side: {}".format(side))

    # @todo checks here that it should be 0 <= x <= 1 ?
    def margin_ratio(self, mreq_type: MarginRequirementKind):
        if mreq_type == Init:
            return self.init_margin_ratio
        elif mreq_type == Maint:
            return self.maint_margin_ratio
        else:
            raise Exception("Unknown margin requirement type: {}".format(type))
