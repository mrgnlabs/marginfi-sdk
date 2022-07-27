from typing import Literal, Any
from dataclasses import dataclass
from datetime import datetime
from anchorpy import Program
from solana.publickey import PublicKey

Side = Literal["bid", "ask"]
OrderType = Literal[
    "Limit",
    "ImmediateOrCancel",
    "PostOnly",
    "ReduceOnlyIoc",
    "ReduceOnlyLimit",
    "FillOrKill",
]
PerpType = Literal["future", "calloption", "putoption", "square"]


@dataclass(frozen=True)
class CollateralInfo:
    mint: PublicKey
    oracle_symbol: str
    decimals: int
    weight: int
    liq_fee: int
    is_borrowable: bool
    optimal_util: int
    optimal_rate: int
    max_rate: int
    og_fee: int
    is_swappable: bool
    serum_open_orders: PublicKey
    max_deposit: int
    dust_threshold: int
    vault: PublicKey


@dataclass(frozen=True)
class FundingInfo:
    hourly: float
    daily: float
    apr: float


@dataclass(frozen=True)
class MarketInfo:
    address: PublicKey
    symbol: str
    oracle_symbol: str
    perp_type: PerpType
    base_decimals: int
    base_lot_size: int
    quote_decimals: int
    quote_lot_size: int
    strike: int
    base_imf: int
    liq_fee: int
    index_price: float
    mark_price: float
    funding_sample_start_time: datetime
    funding_info: None | FundingInfo

    @property
    def funding_rate(self):
        import warnings

        warnings.warn(
            "Use of deprecated `MarketInfo.funding_rate`, please use"
            " `MarketInfo.funding_info`",
            DeprecationWarning,
        )
        return 0 if self.funding_info is None else self.funding_info.hourly


@dataclass(frozen=True)
class PositionInfo:
    size: float
    value: float
    realized_pnl: float
    funding_index: float
    side: Literal["long", "short"]


def order_type_from_str(t: OrderType, /, *, program: Program):
    typ = program.type["OrderType"]
    match t:
        case "limit":
            return typ.Limit()
        case "ioc":
            return typ.ImmediateOrCancel()
        case "postonly":
            return typ.PostOnly()
        case "reduceonlyioc":
            return typ.ReduceOnlyIoc()
        case "reduceonlylimit":
            return typ.ReduceOnlyLimit()
        case "fok":
            return typ.FillOrKill()
        case _:
            raise TypeError(f"unsupported order type {t}")


def perp_type_to_str(t: Any, /, *, program: Program) -> PerpType:
    # HACK: Enum comparison is currently broken, so using `str`.
    t = str(t)
    if t == "PerpType.Future()":
        return "future"
    if t == "PerpType.CallOption()":
        return "calloption"
    if t == "PerpType.PutOption()":
        return "putoption"
    if t == "PerpType.Square()":
        return "square"
    raise LookupError(f"invalid perp type {t}")
