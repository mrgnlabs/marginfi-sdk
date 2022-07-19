from pytest import mark

from marginpy import Bank
from marginpy.generated_client.types import Bank as BankDecoded
from marginpy.generated_client.types.lending_side import Borrow, Deposit
from marginpy.generated_client.types.margin_requirement import Init, Maint
from tests.fixtures import SAMPLE_BANK, MDECIMAL_ZERO, SAMPLE_ACCOUNT_PUBKEY_1


@mark.unit
class TestBank:
    def test___init__(self):
        bank = Bank(
            BankDecoded(
                MDECIMAL_ZERO,
                MDECIMAL_ZERO,
                MDECIMAL_ZERO,
                MDECIMAL_ZERO,
                MDECIMAL_ZERO,
                0,
                MDECIMAL_ZERO,
                MDECIMAL_ZERO,
                SAMPLE_ACCOUNT_PUBKEY_1,
                SAMPLE_ACCOUNT_PUBKEY_1,
                0,
                SAMPLE_ACCOUNT_PUBKEY_1,
                0,
                MDECIMAL_ZERO,
                SAMPLE_ACCOUNT_PUBKEY_1,
                0,
                MDECIMAL_ZERO,
                MDECIMAL_ZERO,
                MDECIMAL_ZERO,
                MDECIMAL_ZERO,
                MDECIMAL_ZERO,
                [],
            )
        )
        assert isinstance(bank, Bank)

    def test_compute_record_native_conversion(self):
        bank = SAMPLE_BANK

        # ---
        bank.borrow_accumulator = 1
        bank.deposit_accumulator = 1
        record = 0
        assert bank.compute_record_amount(record, Borrow) == 0
        assert bank.compute_native_amount(record, Borrow) == 0
        assert bank.compute_record_amount(record, Deposit) == 0
        assert bank.compute_native_amount(record, Deposit) == 0
        # ---
        bank.borrow_accumulator = 1
        bank.deposit_accumulator = 1
        record = 1
        assert bank.compute_record_amount(record, Borrow) == 1
        assert bank.compute_native_amount(record, Borrow) == 1
        assert bank.compute_record_amount(record, Deposit) == 1
        assert bank.compute_native_amount(record, Deposit) == 1
        # ---
        bank.borrow_accumulator = 1
        bank.deposit_accumulator = 1
        record = 100_000
        assert bank.compute_record_amount(record, Borrow) == 100_000
        assert bank.compute_native_amount(record, Borrow) == 100_000
        assert bank.compute_record_amount(record, Deposit) == 100_000
        assert bank.compute_native_amount(record, Deposit) == 100_000
        # ---
        bank.borrow_accumulator = 2
        bank.deposit_accumulator = 2
        record = 100_000
        assert bank.compute_record_amount(record, Borrow) == 50_000
        assert bank.compute_native_amount(record, Borrow) == 200_000
        assert bank.compute_record_amount(record, Deposit) == 50_000
        assert bank.compute_native_amount(record, Deposit) == 200_000
        # ---
        bank.borrow_accumulator = 0.5
        bank.deposit_accumulator = 0.5
        record = 100_000
        assert bank.compute_record_amount(record, Borrow) == 200_000
        assert bank.compute_native_amount(record, Borrow) == 50_000
        assert bank.compute_record_amount(record, Deposit) == 200_000
        assert bank.compute_native_amount(record, Deposit) == 50_000
        # ---
        bank.borrow_accumulator = 0.2
        bank.deposit_accumulator = 0.2
        record = 0.25
        assert bank.compute_record_amount(record, Borrow) == 1.25
        assert bank.compute_native_amount(record, Borrow) == 0.05
        assert bank.compute_record_amount(record, Deposit) == 1.25
        assert bank.compute_native_amount(record, Deposit) == 0.05

    def test_margin_ratio(self):
        bank = SAMPLE_BANK

        # Init
        mreq_type = Init
        bank.init_margin_ratio = 1
        assert bank.margin_ratio(mreq_type) == 1
        # ---
        bank.init_margin_ratio = 0.5
        assert bank.margin_ratio(mreq_type) == 0.5
        # ---
        bank.init_margin_ratio = 0
        assert bank.margin_ratio(mreq_type) == 0

        # # Maint
        mreq_type = Maint
        bank.maint_margin_ratio = 1
        assert bank.margin_ratio(mreq_type) == 1
        # ---
        bank.maint_margin_ratio = 0.5
        assert bank.margin_ratio(mreq_type) == 0.5
        # ---
        bank.maint_margin_ratio = 0
        assert bank.margin_ratio(mreq_type) == 0
