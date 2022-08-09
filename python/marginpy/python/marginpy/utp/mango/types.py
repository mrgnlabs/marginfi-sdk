from dataclasses import dataclass
from decimal import Decimal
from enum import Enum
from typing import Optional

import mango
from marginpy.generated_client.types.mango_expiry_type import (
    Absolute,
    MangoExpiryTypeKind,
    Relative,
)
from marginpy.generated_client.types.mango_order_type import (
    ImmediateOrCancel,
    Limit,
    MangoOrderTypeKind,
    Market,
    PostOnly,
    PostOnlySlide,
)
from marginpy.generated_client.types.mango_side import Ask, Bid, MangoSideKind
from solana.publickey import PublicKey

USDC_TOKEN_MAINNET = mango.Token(
    "USDC",
    "USD Coin",
    Decimal(6),
    PublicKey("EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v"),
)

USDC_TOKEN_DEVNET = mango.Token(
    "USDC",
    "USD Coin",
    Decimal(6),
    PublicKey("8FRFC6MoGGkMFQwngccyu69VnYbzykGeez7ignHVAFSN"),
)

USDC_TOKEN_DICT = {"mainnet": USDC_TOKEN_MAINNET, "devnet": USDC_TOKEN_DEVNET}


class MangoSide(Enum):
    BID = "BID"
    ASK = "ASK"

    def to_program_type(self) -> MangoSideKind:
        if self is self.BID:
            return Bid()
        if self is self.ASK:
            return Ask()
        raise Exception(f"Unknown Mango side {self.value}")


class MangoExpiryType(Enum):
    ABSOLUTE = "ABSOLUTE"
    RELATIVE = "RELATIVE"

    def to_program_type(self) -> MangoExpiryTypeKind:
        if self is self.ABSOLUTE:
            return Absolute()
        if self is self.RELATIVE:
            return Relative()
        raise Exception(f"Unknown Mango expiry type {self.value}")


class MangoOrderType(Enum):
    LIMIT = "LIMIT"
    IMMEDIATE_OR_CANCEL = "IMMEDIATE_OR_CANCEL"
    POST_ONLY = "POST_ONLY"
    MARKET = "MARKET"
    POST_ONLY_SLIDE = "POST_ONLY_SLIDE"

    def to_program_type(self) -> MangoOrderTypeKind:
        if self is self.LIMIT:
            return Limit()
        if self is self.IMMEDIATE_OR_CANCEL:
            return ImmediateOrCancel()
        if self is self.POST_ONLY:
            return PostOnly()
        if self is self.MARKET:
            return Market()
        if self is self.POST_ONLY_SLIDE:
            return PostOnlySlide()
        raise Exception(f"Unknown Mango order type {self.value}")


@dataclass
class UtpMangoPlacePerpOrderOptions:
    max_quote_quantity: Optional[float] = None
    limit: Optional[int] = None
    order_type: Optional[MangoOrderType] = None
    client_order_id: Optional[int] = None
    reduce_only: Optional[bool] = None
    expiry_timestamp: Optional[int] = None
    expiry_type: Optional[MangoExpiryType] = None
