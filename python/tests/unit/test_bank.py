from marginpy import Bank
from marginpy.generated_client.types import Bank as BankDecoded
from marginpy.types import LendingSide, MarginRequirement
from pytest import mark

from tests.fixtures import I80F48_ZERO, SAMPLE_ACCOUNT_PUBKEY_1, SAMPLE_BANK


@mark.unit
class TestBank:
    def test___init__(self):
        bank = Bank(
            BankDecoded(
                I80F48_ZERO,
                I80F48_ZERO,
                I80F48_ZERO,
                I80F48_ZERO,
                I80F48_ZERO,
                0,
                I80F48_ZERO,
                I80F48_ZERO,
                SAMPLE_ACCOUNT_PUBKEY_1,
                SAMPLE_ACCOUNT_PUBKEY_1,
                0,
                SAMPLE_ACCOUNT_PUBKEY_1,
                0,
                I80F48_ZERO,
                SAMPLE_ACCOUNT_PUBKEY_1,
                0,
                I80F48_ZERO,
                I80F48_ZERO,
                I80F48_ZERO,
                I80F48_ZERO,
                I80F48_ZERO,
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
        assert bank.compute_record_amount(record, LendingSide.BORROW) == 0
        assert bank.compute_native_amount(record, LendingSide.BORROW) == 0
        assert bank.compute_record_amount(record, LendingSide.DEPOSIT) == 0
        assert bank.compute_native_amount(record, LendingSide.DEPOSIT) == 0
        # ---
        bank.borrow_accumulator = 1
        bank.deposit_accumulator = 1
        record = 1
        assert bank.compute_record_amount(record, LendingSide.BORROW) == 1
        assert bank.compute_native_amount(record, LendingSide.BORROW) == 1
        assert bank.compute_record_amount(record, LendingSide.DEPOSIT) == 1
        assert bank.compute_native_amount(record, LendingSide.DEPOSIT) == 1
        # ---
        bank.borrow_accumulator = 1
        bank.deposit_accumulator = 1
        record = 100_000
        assert bank.compute_record_amount(record, LendingSide.BORROW) == 100_000
        assert bank.compute_native_amount(record, LendingSide.BORROW) == 100_000
        assert bank.compute_record_amount(record, LendingSide.DEPOSIT) == 100_000
        assert bank.compute_native_amount(record, LendingSide.DEPOSIT) == 100_000
        # ---
        bank.borrow_accumulator = 2
        bank.deposit_accumulator = 2
        record = 100_000
        assert bank.compute_record_amount(record, LendingSide.BORROW) == 50_000
        assert bank.compute_native_amount(record, LendingSide.BORROW) == 200_000
        assert bank.compute_record_amount(record, LendingSide.DEPOSIT) == 50_000
        assert bank.compute_native_amount(record, LendingSide.DEPOSIT) == 200_000
        # ---
        bank.borrow_accumulator = 0.5
        bank.deposit_accumulator = 0.5
        record = 100_000
        assert bank.compute_record_amount(record, LendingSide.BORROW) == 200_000
        assert bank.compute_native_amount(record, LendingSide.BORROW) == 50_000
        assert bank.compute_record_amount(record, LendingSide.DEPOSIT) == 200_000
        assert bank.compute_native_amount(record, LendingSide.DEPOSIT) == 50_000
        # ---
        bank.borrow_accumulator = 0.2
        bank.deposit_accumulator = 0.2
        record = 0.25
        assert bank.compute_record_amount(record, LendingSide.BORROW) == 1.25
        assert bank.compute_native_amount(record, LendingSide.BORROW) == 0.05
        assert bank.compute_record_amount(record, LendingSide.DEPOSIT) == 1.25
        assert bank.compute_native_amount(record, LendingSide.DEPOSIT) == 0.05

    def test_margin_ratio(self):
        bank = SAMPLE_BANK

        # Init
        mreq_type = MarginRequirement.INITIAL
        bank.init_margin_ratio = 1
        assert bank.compute_margin_ratio(mreq_type) == 1
        # ---
        bank.init_margin_ratio = 0.5
        assert bank.compute_margin_ratio(mreq_type) == 0.5
        # ---
        bank.init_margin_ratio = 0
        assert bank.compute_margin_ratio(mreq_type) == 0

        # # Maint
        mreq_type = MarginRequirement.MAINTENANCE
        bank.maint_margin_ratio = 1
        assert bank.compute_margin_ratio(mreq_type) == 1
        # ---
        bank.maint_margin_ratio = 0.5
        assert bank.compute_margin_ratio(mreq_type) == 0.5
        # ---
        bank.maint_margin_ratio = 0
        assert bank.compute_margin_ratio(mreq_type) == 0
