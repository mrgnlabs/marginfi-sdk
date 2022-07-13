from pytest import mark
from marginpy.decimal import Decimal
from dataclasses import dataclass


@mark.unit
def test_decimal_conversion() -> None:
    """Test conversion to integer."""

    @dataclass
    class TestCase:
        input: (int, int, int, int)  # (flags, hi, lo, mid)
        expected_base_integer: float
        expected_float: float
        expected_scale: int
        expected_is_negative: bool

    cases = [
        TestCase((0, 0, 1, 0), 1, 1., 0, False),
        TestCase((0, 0, 0, 0), 0, 0., 0, False),
        TestCase((0, 0, 18373948, 0), 18_373_948, 18373948., 0, False),
        TestCase((2147483648, 0, 1, 0), -1, -1., 0, True),
        TestCase((2147483648, 0, 18373948, 0), -18_373_948, -18_373_948., 0, True),
        TestCase((524288, 0, 3560562382, 427801), 1_837_394_864_758_478, 18_373_948.64758478, 8, False),
        TestCase((589824, 54, 1860108287, 902178515), 999_999_007_199_254_740_991, 999_999_007_199.254740991, 9, False),
        TestCase((720896, 0, 254740991, 0), 254740991, 0.00254740991, 11, False),
        TestCase((655360, 0, 433823350, 2), 9023757942, 0.9023757942, 10, False),
        TestCase((-2146959360, 0, 3560562382, 427801), -1837394864758478, -18373948.64758478, 8, True),
    ]

    for test in cases:
        decimal = Decimal(*test.input)
        assert decimal.to_base_integer() == test.expected_base_integer
        assert decimal.to_float() == test.expected_float
        assert decimal.scale == test.expected_scale
        assert decimal.is_negative == test.expected_is_negative
