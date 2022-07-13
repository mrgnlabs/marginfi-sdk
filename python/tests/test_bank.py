import pytest

from solana.publickey import PublicKey
from marginpy import Bank
from marginpy.generated_client.types import Bank as BankDecoded, m_decimal, LendingSideKind, MarginRequirementKind

class TestBank():
    def test___init__(self):

        m_decimal_json_zero = {
            "flags": 0,
            "hi": 0,
            "lo": 0,
            "mid": 0,
        }

        bank_json = {
            "scaling_factor_c": m_decimal_json_zero,
            "fixed_fee": m_decimal_json_zero,
            "interest_fee": m_decimal_json_zero,
            "deposit_accumulator": m_decimal_json_zero,
            "borrow_accumulator": m_decimal_json_zero,
            "last_update": 0,
            "native_deposit_balance": m_decimal_json_zero,
            "native_borrow_balance": m_decimal_json_zero,
            "mint": "C51P2JKDB3KFPGgcFGmyaWtKcKo58Dez5VSccGjhVfX9",
            "vault": "C51P2JKDB3KFPGgcFGmyaWtKcKo58Dez5VSccGjhVfX9",
            "vault_authority_pda_bump": 0,
            "insurance_vault": "C51P2JKDB3KFPGgcFGmyaWtKcKo58Dez5VSccGjhVfX9",
            "insurance_vault_authority_pda_bump": 0,
            "insurance_vault_outstanding_transfers": m_decimal_json_zero,
            "fee_vault": "C51P2JKDB3KFPGgcFGmyaWtKcKo58Dez5VSccGjhVfX9",
            "fee_vault_authority_pda_bump": 0,
            "fee_vault_outstanding_transfers": m_decimal_json_zero,
            "init_margin_ratio": m_decimal_json_zero,
            "maint_margin_ratio": m_decimal_json_zero,
            "account_deposit_limit": m_decimal_json_zero,
            "lp_deposit_limit": m_decimal_json_zero,
            "reserved_space": [0,0,0]
        }

        bank_decoded = BankDecoded.from_json(bank_json)
        bank = Bank(bank_decoded)

        assert isinstance(bank, Bank)

    # def test_compute_native_amount_borrow_1(self):
    #     record = 0
    #     side = LendingSideKind.Borrow

    # def test_compute_native_amount_borrow_2(self):
    #     record = 0
    #     side = LendingSideKind.Borrow

    # def test_compute_native_amount_deposit_1(self):
    #     record = 0
    #     side = LendingSideKind.Deposit

    # def test_compute_native_amount_deposit_2(self):
    #     record = 0
    #     side = LendingSideKind.Deposit