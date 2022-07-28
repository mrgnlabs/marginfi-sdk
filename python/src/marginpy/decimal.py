from marginpy.generated_client.types import MDecimal as DecimalData

SCALE_SHIFT: int = 16
SCALE_MASK: int = 0x00FF_0000
SIGN_MASK: int = 0x8000_0000


class Decimal:
    flags: int
    hi: int
    lo: int
    mid: int

    def __init__(self, flags: int, hi: int, lo: int, mid: int) -> None:
        self.flags = flags
        self.hi = hi
        self.lo = lo
        self.mid = mid

    @staticmethod
    def from_account_data(data: DecimalData):
        return Decimal(data.flags, data.hi, data.lo, data.mid)

    @property
    def scale(self):
        return (self.flags & SCALE_MASK) >> SCALE_SHIFT

    @property
    def is_negative(self):
        return (self.flags & SIGN_MASK) != 0

    @property
    def is_positive(self):
        return not self.is_negative

    def to_base_integer(self):
        number = 0 | self.lo | self.mid << 32 | self.hi << 64
        if self.is_negative:
            return -number
        return number

    def to_float(self):
        return self.to_base_integer() / 10**self.scale
