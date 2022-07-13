from marginpy.generated_client.types import Bank as BankDecoded, LendingSideKind, MarginRequirementKind

class Bank:
    
    #@todo figure out number types: float vs. int vs. etc.
    def __init__(self, data: BankDecoded) -> None:
        self.scaling_factor_c = data.scaling_factor_c
        self.fixed_fee = data.fixed_fee
        self.interest_fee = data.interest_fee
        self.deposit_accumulator = data.deposit_accumulator
        self.borrow_accumulator = data.borrow_accumulator
        self.last_update = data.last_update
        self.native_deposit_balance = data.native_deposit_balance
        self.native_borrow_balance = data.native_borrow_balance
        self.mint = data.mint
        self.vault = data.vault
        self.vault_authority_pda_bump = data.vault_authority_pda_bump
        self.insurance_vault = data.insurance_vault
        self.insurance_vault_authority_pda_bump = data.insurance_vault_authority_pda_bump
        self.insurance_vault_outstanding_transfers = data.insurance_vault_outstanding_transfers
        self.fee_vault = data.fee_vault
        self.fee_vault_authority_pda_bump = data.fee_vault_authority_pda_bump
        self.fee_vault_outstanding_transfers = data.fee_vault_outstanding_transfers
        self.init_margin_ratio = data.init_margin_ratio
        self.maint_margin_ratio = data.maint_margin_ratio
        self.account_deposit_limit = data.account_deposit_limit
        self.lp_deposit_limit = data.lp_deposit_limit
        self.reserved_space = data.reserved_space
    
    def compute_native_amount(
        self,
        record: float, #@todo type might need to be different
        side: LendingSideKind,
    ):
        if side == LendingSideKind.Borrow:
            return record * self.borrow_accumulator
        elif side == LendingSideKind.Deposit:
            return record * self.deposit_accumulator
        else:
            raise Exception(
                "Unknown lending side: {}".format(side)
            )

    def compute_record_amount(
        self,
        record: float, #@todo type might need to be different
        side: LendingSideKind
    ):
        if side == LendingSideKind.Borrow:
            return record / self.borrow_accumulator
        elif side == LendingSideKind.Deposit:
            return record / self.deposit_accumulator
        else:
            raise Exception(
                "Unknown lending side: {}".format(side)
            )

    def margin_ratio(
        self,
        type: MarginRequirementKind
    ):
        if type == MarginRequirementKind.Init:
            return self.init_margin_ratio
        elif type == MarginRequirementKind.Maint:
            return self.maint_margin_ratio
        else:
            raise Exception(
                "Unknown margin requirement type: {}".format(type)
            )
