from pytest import approx, mark

from tests.utils import load_marginfi_account


@mark.unit
def test_fixed_conversion() -> None:
    """Test conversion to float."""

    _, account = load_marginfi_account("marginfi_account_2")

    assert account.deposits == approx(143, 0.000001)
