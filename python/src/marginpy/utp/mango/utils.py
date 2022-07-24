import typing
import construct
from datetime import datetime
from decimal import Decimal
from solana.publickey import PublicKey

# # Adapters
#
# These are adapters for the construct package to simplify our struct declarations.

# ## DecimalAdapter class
#
# A simple construct `Adapter` that lets us use `Decimal`s directly in our structs.
#
if typing.TYPE_CHECKING:

    class DecimalAdapter(construct.Adapter[Decimal, int, typing.Any, typing.Any]):
        def __init__(self, size: int = 8) -> None:
            pass

else:

    class DecimalAdapter(construct.Adapter):
        def __init__(self, size: int = 8) -> None:
            super().__init__(construct.BytesInteger(size, swapped=True))

        def _decode(self, obj: int, context: typing.Any, path: typing.Any) -> Decimal:
            return Decimal(obj)

        def _encode(self, obj: Decimal, context: typing.Any, path: typing.Any) -> int:
            # Can only encode Decimal values.
            return int(obj)


# ## PublicKeyAdapter
#
# A simple construct `Adapter` that lets us use `PublicKey`s directly in our structs.
#
if typing.TYPE_CHECKING:

    class PublicKeyAdapter(construct.Adapter[PublicKey, bytes, typing.Any, typing.Any]):
        def __init__(self) -> None:
            pass

else:

    class PublicKeyAdapter(construct.Adapter):
        def __init__(self) -> None:
            super().__init__(construct.Bytes(32))

        def _decode(
            self, obj: bytes, context: typing.Any, path: typing.Any
        ) -> typing.Optional[PublicKey]:
            if (obj is None) or (obj == bytes([0] * 32)):
                return None
            return PublicKey(obj)

        def _encode(
            self, obj: PublicKey, context: typing.Any, path: typing.Any
        ) -> bytes:
            return bytes(obj)


# ## FloatI80F48Adapter
#
# Rust docs say a fixed::types::I80F48 is:
# "FixedI128 with 80 integer bits and 48 fractional bits.""
#
# So it's 128 bits, or 16 bytes, long, and the first 10 bytes are the
# integer part and the last 6 bytes are the fractional part.
#
if typing.TYPE_CHECKING:

    class FloatI80F48Adapter(construct.Adapter[Decimal, int, typing.Any, typing.Any]):
        def __init__(self) -> None:
            pass

else:

    class FloatI80F48Adapter(construct.Adapter):
        def __init__(self) -> None:
            self.size = 16
            super().__init__(
                construct.BytesInteger(self.size, signed=True, swapped=True)
            )

            # For our string of bits, our 'fixed point' is between the 10th byte and 11th byte. We want
            # the last 6 bytes to be fractional, so:
            fixed_point_in_bits = 8 * 6

            # So our divisor is 2 to the power of the fixed point
            self.divisor = Decimal(2**fixed_point_in_bits)

        def _decode(self, obj: int, context: typing.Any, path: typing.Any) -> Decimal:
            # How many decimal places precision should we allow for an I80F48? TypeScript seems to have
            # 20 decimal places. The Decimal class is a bit weird - although the standard Python round()
            # is available, it can fail with InvalidOperation if the precision requested doesn't actually
            # exist. That's the wrong way around for us - we want to ensure we don't have MORE digits
            # than 20, not raise an exception when we have a sufficiently rounded number already.
            value: Decimal = Decimal(obj)
            divided: Decimal = value / self.divisor
            return divided.quantize(
                Decimal(".00000000000000000001"), context=DecimalContext(prec=100)
            )

        def _encode(self, obj: Decimal, context: typing.Any, path: typing.Any) -> int:
            return int(obj)


# ## SignedDecimalAdapter class
#
# Another simple `Decimal` `Adapter` but this one specifically works with signed decimals.
#
if typing.TYPE_CHECKING:

    class SignedDecimalAdapter(construct.Adapter[Decimal, int, typing.Any, typing.Any]):
        def __init__(self, size: int = 8) -> None:
            pass

else:

    class SignedDecimalAdapter(construct.Adapter):
        def __init__(self, size: int = 8) -> None:
            super().__init__(construct.BytesInteger(size, signed=True, swapped=True))

        def _decode(self, obj: int, context: typing.Any, path: typing.Any) -> Decimal:
            return Decimal(obj)

        def _encode(self, obj: Decimal, context: typing.Any, path: typing.Any) -> int:
            # Can only encode int values.
            return int(obj)


# ## DatetimeAdapter
#
# A simple construct `Adapter` that lets us load `datetime`s directly in our structs.
#
if typing.TYPE_CHECKING:

    class DatetimeAdapter(construct.Adapter[datetime, int, typing.Any, typing.Any]):
        def __init__(self) -> None:
            pass

else:

    class DatetimeAdapter(construct.Adapter):
        def __init__(self) -> None:
            super().__init__(construct.BytesInteger(8, swapped=True))

        def _decode(self, obj: int, context: typing.Any, path: typing.Any) -> datetime:
            return datetime_from_chain(obj)

        def _encode(self, obj: datetime, context: typing.Any, path: typing.Any) -> int:
            return int(obj.timestamp())


DATA_TYPE = construct.Enum(
    construct.Int8ul,
    Group=0,
    Account=1,
    RootBank=2,
    NodeBank=3,
    PerpMarket=4,
    Bids=5,
    Asks=6,
    Cache=7,
    EventQueue=8,
    AdvancedOrders=9,
    ReferrerMemory=10,
    ReferrerIdRecord=11,
)
MAX_TOKENS: int = 16
MAX_PAIRS: int = MAX_TOKENS - 1
MAX_NODE_BANKS: int = 8
