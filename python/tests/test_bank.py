from pytest import mark

from solana.publickey import PublicKey
from marginpy import Bank
from marginpy.generated_client.types import Bank as BankDecoded, MDecimal
from marginpy.generated_client.types.lending_side import Borrow, Deposit
from marginpy.generated_client.types.margin_requirement import Init, Maint

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

    @mark.unit
    def test_compute_native_amount(self):

        # Construct Bank class, then override self.borrow_accumulator
        # to make it easier.
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
        
        ###
        # Borrow
        ###
        bank.borrow_accumulator = 1
        record_0 = MDecimal.from_json(m_decimal_json_zero)
        side_0 = Borrow

        res_actual_0 = bank.compute_native_amount(
            record_0,
            side_0
        )
        res_exp_0 = 0
        assert res_exp_0 == res_actual_0

        # @todo mocking MDecimal can be improved
        # 1
        # bank.borrow_accumulator = 1
        # record_1 = 0
        # side_1 = Borrow

        # res_actual_1 = bank.compute_native_amount(
        #     record_1,
        #     side_1
        # )
        # res_exp_1 = 0
        # assert res_exp_1 == res_actual_1

        # #2
        # bank.borrow_accumulator = 1
        # record_2 = 1
        # side_2 = Borrow

        # res_actual_2 = bank.compute_native_amount(
        #     record_2,
        #     side_2
        # )
        # res_exp_2 = 1
        # assert res_exp_2 == res_actual_2

        # #3
        # bank.borrow_accumulator = 1
        # record_3 = 100000
        # side_3 = Borrow

        # res_actual_3 = bank.compute_native_amount(
        #     record_3,
        #     side_3
        # )
        # res_exp_3 = 100000
        # assert res_exp_3 == res_actual_3

        # #4
        # bank.borrow_accumulator = 2
        # record_4 = 100000
        # side_4 = Borrow

        # res_actual_4 = bank.compute_native_amount(
        #     record_4,
        #     side_4
        # )
        # res_exp_4 = 200000
        # assert res_exp_4 == res_actual_4

        # ###
        # # Deposit
        # ###
        bank.deposit_accumulator = 1
        record_00 = MDecimal.from_json(m_decimal_json_zero)
        side_00 = Deposit

        res_actual_00 = bank.compute_native_amount(
            record_00,
            side_00
        )
        res_exp_00 = 0
        assert res_exp_00 == res_actual_00
        
        # #5
        # bank.deposit_accumulator = 1
        # record_5 = 0
        # side_5 = Deposit

        # res_actual_5 = bank.compute_native_amount(
        #     record_5,
        #     side_5
        # )
        # res_exp_5 = 0
        # assert res_exp_5 == res_actual_5

        # #6
        # bank.deposit_accumulator = 1
        # record_6 = 1
        # side_6 = Deposit

        # res_actual_6 = bank.compute_native_amount(
        #     record_6,
        #     side_6
        # )
        # res_exp_6 = 1
        # assert res_exp_6 == res_actual_6

        # #7
        # bank.deposit_accumulator = 1
        # record_7 = 100000
        # side_7 = Deposit

        # res_actual_7 = bank.compute_native_amount(
        #     record_7,
        #     side_7
        # )
        # res_exp_7 = 100000
        # assert res_exp_7 == res_actual_7

        # #8
        # bank.deposit_accumulator = 2
        # record_8 = 100000
        # side_8 = Deposit

        # res_actual_8 = bank.compute_native_amount(
        #     record_8,
        #     side_8
        # )
        # res_exp_8 = 200000
        # assert res_exp_8 == res_actual_8


    @mark.unit
    def test_compute_record_amount(self):

        # Construct Bank class, then override self.borrow_accumulator
        # to make it easier.
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
        
        ###
        # Borrow
        ###
        bank.borrow_accumulator = 1
        record_0 = MDecimal.from_json(m_decimal_json_zero)
        side_0 = Borrow

        res_actual_0 = bank.compute_record_amount(
            record_0,
            side_0
        )
        res_exp_0 = 0
        assert res_exp_0 == res_actual_0

        # 1
        # bank.borrow_accumulator = 1
        # record_1 = 0
        # side_1 = Borrow

        # res_actual_1 = bank.compute_record_amount(
        #     record_1,
        #     side_1
        # )
        # res_exp_1 = 0
        # assert res_exp_1 == res_actual_1

        # #2
        # bank.borrow_accumulator = 1
        # record_2 = 1
        # side_2 = Borrow

        # res_actual_2 = bank.compute_record_amount(
        #     record_2,
        #     side_2
        # )
        # res_exp_2 = 1
        # assert res_exp_2 == res_actual_2

        # #3
        # bank.borrow_accumulator = 1
        # record_3 = 100000
        # side_3 = Borrow

        # res_actual_3 = bank.compute_record_amount(
        #     record_3,
        #     side_3
        # )
        # res_exp_3 = 100000
        # assert res_exp_3 == res_actual_3

        # #4
        # bank.borrow_accumulator = 2
        # record_4 = 100000
        # side_4 = Borrow

        # res_actual_4 = bank.compute_record_amount(
        #     record_4,
        #     side_4
        # )
        # res_exp_4 = 50000
        # assert res_exp_4 == res_actual_4

        # ###
        # # Deposit
        # ###
        bank.deposit_accumulator = 1
        record_00 = MDecimal.from_json(m_decimal_json_zero)
        side_00 = Deposit

        res_actual_00 = bank.compute_record_amount(
            record_00,
            side_00
        )
        res_exp_00 = 0
        assert res_exp_00 == res_actual_00
        
        # #5
        # bank.deposit_accumulator = 1
        # record_5 = 0
        # side_5 = Deposit

        # res_actual_5 = bank.compute_record_amount(
        #     record_5,
        #     side_5
        # )
        # res_exp_5 = 0
        # assert res_exp_5 == res_actual_5

        # #6
        # bank.deposit_accumulator = 1
        # record_6 = 1
        # side_6 = Deposit

        # res_actual_6 = bank.compute_record_amount(
        #     record_6,
        #     side_6
        # )
        # res_exp_6 = 1
        # assert res_exp_6 == res_actual_6

        # #7
        # bank.deposit_accumulator = 1
        # record_7 = 100000
        # side_7 = Deposit

        # res_actual_7 = bank.compute_record_amount(
        #     record_7,
        #     side_7
        # )
        # res_exp_7 = 100000
        # assert res_exp_7 == res_actual_7

        # #8
        # bank.deposit_accumulator = 2
        # record_8 = 100000
        # side_8 = Deposit

        # res_actual_8 = bank.compute_record_amount(
        #     record_8,
        #     side_8
        # )
        # res_exp_8 = 50000
        # assert res_exp_8 == res_actual_8

    @mark.unit
    def test_margin_ratio(self):

        # Construct Bank class, then override self.borrow_accumulator
        # to make it easier.
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


        ###
        # Init
        ###
        bank.init_margin_ratio = 1
        res_exp_1 = 1
        mreq_type_1 = Init
        res_actual_1 = bank.margin_ratio(mreq_type_1)
        assert res_exp_1 == res_actual_1

        bank.init_margin_ratio = 0.5
        res_exp_2 = 0.5
        mreq_type_2 = Init
        res_actual_2 = bank.margin_ratio(mreq_type_2)
        assert res_exp_2 == res_actual_2

        bank.init_margin_ratio = 0
        res_exp_3 = 0
        mreq_type_3 = Init
        res_actual_3 = bank.margin_ratio(mreq_type_3)
        assert res_exp_3 == res_actual_3


        ###
        # Maint
        ###
        bank.maint_margin_ratio = 1
        res_exp_4 = 1
        mreq_type_4 = Maint
        res_actual_4 = bank.margin_ratio(mreq_type_4)
        assert res_exp_4 == res_actual_4

        bank.maint_margin_ratio = 0.5
        res_exp_5 = 0.5
        mreq_type_5 = Maint
        res_actual_5 = bank.margin_ratio(mreq_type_5)
        assert res_exp_5 == res_actual_5

        bank.maint_margin_ratio = 0
        res_exp_6 = 0
        mreq_type_6 = Maint
        res_actual_6 = bank.margin_ratio(mreq_type_6)
        assert res_exp_6 == res_actual_6
