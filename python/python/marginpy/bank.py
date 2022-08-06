from datetime import datetime

from marginpy.constants import COLLATERAL_SCALING_FACTOR, PARTIAL_LIQUIDATION_FACTOR
from marginpy.types import BankData, LendingSide, MarginRequirement
from marginpy.utils.data_conversion import wrapped_fixed_to_float
from solana.publickey import PublicKey


class Bank:
    """
    Bank struct mirroring on-chain data.

    Contains the state of the marginfi group.
    """

    scaling_factor_c: float
    fixed_fee: float
    interest_fee: float
    deposit_accumulator: float
    borrow_accumulator: float
    last_update: datetime
    total_deposits_record: float
    total_borrows_record: float
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

    def __init__(self, data: BankData) -> None:
        self.scaling_factor_c = wrapped_fixed_to_float(data.scaling_factor_c)
        self.fixed_fee = wrapped_fixed_to_float(data.fixed_fee)
        self.interest_fee = wrapped_fixed_to_float(data.interest_fee)
        self.deposit_accumulator = wrapped_fixed_to_float(data.deposit_accumulator)
        self.borrow_accumulator = wrapped_fixed_to_float(data.borrow_accumulator)
        self.last_update = datetime.fromtimestamp(data.last_update)
        self.total_deposits_record = (
            wrapped_fixed_to_float(data.total_deposits_record)
            / COLLATERAL_SCALING_FACTOR
        )
        self.total_borrows_record = (
            wrapped_fixed_to_float(data.total_borrows_record)
            / COLLATERAL_SCALING_FACTOR
        )
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
        self.init_margin_ratio = wrapped_fixed_to_float(data.init_margin_ratio)
        self.maint_margin_ratio = wrapped_fixed_to_float(data.maint_margin_ratio)
        self.account_deposit_limit = (
            wrapped_fixed_to_float(data.account_deposit_limit)
            / COLLATERAL_SCALING_FACTOR
        )
        self.lp_deposit_limit = (
            wrapped_fixed_to_float(data.lp_deposit_limit) / COLLATERAL_SCALING_FACTOR
        )

    def compute_native_amount(
        self,
        record_amount: float,
        side: LendingSide,
    ) -> float:
        """
        Converts the provided record amount to its native amount respective to current accumulator.

        Raises:
            Exception: unknown side
        """

        if side == LendingSide.BORROW:
            return record_amount * self.borrow_accumulator

        if side == LendingSide.DEPOSIT:
            return record_amount * self.deposit_accumulator

        raise Exception(f"Unknown lending side: {side}")

    def compute_record_amount(self, native_amount: float, side: LendingSide) -> float:
        """
        Converts the provided native amount to its record amount respective to current accumulator.

        Raises:
            Exception: unknown side
        """

        if side == LendingSide.BORROW:
            return native_amount / self.borrow_accumulator

        if side == LendingSide.DEPOSIT:
            return native_amount / self.deposit_accumulator

        raise Exception(f"Unknown lending side: {side}")

    def compute_margin_ratio(self, mreq_type: MarginRequirement) -> float:
        if mreq_type is MarginRequirement.INITIAL:
            return self.init_margin_ratio

        if mreq_type is MarginRequirement.MAINTENANCE:
            return self.maint_margin_ratio

        if mreq_type is MarginRequirement.PARTIAL_LIQUIDATION:
            return self.maint_margin_ratio + PARTIAL_LIQUIDATION_FACTOR * (self.init_margin_ratio - self.maint_margin_ratio)

        raise Exception(f"Unknown margin requirement type: {mreq_type}")
