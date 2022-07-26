from __future__ import annotations
from . import (
    symbol,
)
import typing
from dataclasses import dataclass
from construct import Container
from solana.publickey import PublicKey
from anchorpy.borsh_extension import BorshPubkey
import borsh_construct as borsh


class CollateralInfoJSON(typing.TypedDict):
    mint: str
    oracle_symbol: symbol.SymbolJSON
    decimals: int
    weight: int
    liq_fee: int
    is_borrowable: bool
    optimal_util: int
    optimal_rate: int
    max_rate: int
    og_fee: int
    is_swappable: bool
    serum_open_orders: str
    max_deposit: int
    dust_threshold: int
    padding: list[int]


@dataclass
class CollateralInfo:
    layout: typing.ClassVar = borsh.CStruct(
        "mint" / BorshPubkey,
        "oracle_symbol" / symbol.Symbol.layout,
        "decimals" / borsh.U8,
        "weight" / borsh.U16,
        "liq_fee" / borsh.U16,
        "is_borrowable" / borsh.Bool,
        "optimal_util" / borsh.U16,
        "optimal_rate" / borsh.U16,
        "max_rate" / borsh.U16,
        "og_fee" / borsh.U16,
        "is_swappable" / borsh.Bool,
        "serum_open_orders" / BorshPubkey,
        "max_deposit" / borsh.U64,
        "dust_threshold" / borsh.U16,
        "padding" / borsh.U8[384],
    )
    mint: PublicKey
    oracle_symbol: symbol.Symbol
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
    padding: list[int]

    @classmethod
    def from_decoded(cls, obj: Container) -> "CollateralInfo":
        return cls(
            mint=obj.mint,
            oracle_symbol=symbol.Symbol.from_decoded(obj.oracle_symbol),
            decimals=obj.decimals,
            weight=obj.weight,
            liq_fee=obj.liq_fee,
            is_borrowable=obj.is_borrowable,
            optimal_util=obj.optimal_util,
            optimal_rate=obj.optimal_rate,
            max_rate=obj.max_rate,
            og_fee=obj.og_fee,
            is_swappable=obj.is_swappable,
            serum_open_orders=obj.serum_open_orders,
            max_deposit=obj.max_deposit,
            dust_threshold=obj.dust_threshold,
            padding=obj.padding,
        )

    def to_encodable(self) -> dict[str, typing.Any]:
        return {
            "mint": self.mint,
            "oracle_symbol": self.oracle_symbol.to_encodable(),
            "decimals": self.decimals,
            "weight": self.weight,
            "liq_fee": self.liq_fee,
            "is_borrowable": self.is_borrowable,
            "optimal_util": self.optimal_util,
            "optimal_rate": self.optimal_rate,
            "max_rate": self.max_rate,
            "og_fee": self.og_fee,
            "is_swappable": self.is_swappable,
            "serum_open_orders": self.serum_open_orders,
            "max_deposit": self.max_deposit,
            "dust_threshold": self.dust_threshold,
            "padding": self.padding,
        }

    def to_json(self) -> CollateralInfoJSON:
        return {
            "mint": str(self.mint),
            "oracle_symbol": self.oracle_symbol.to_json(),
            "decimals": self.decimals,
            "weight": self.weight,
            "liq_fee": self.liq_fee,
            "is_borrowable": self.is_borrowable,
            "optimal_util": self.optimal_util,
            "optimal_rate": self.optimal_rate,
            "max_rate": self.max_rate,
            "og_fee": self.og_fee,
            "is_swappable": self.is_swappable,
            "serum_open_orders": str(self.serum_open_orders),
            "max_deposit": self.max_deposit,
            "dust_threshold": self.dust_threshold,
            "padding": self.padding,
        }

    @classmethod
    def from_json(cls, obj: CollateralInfoJSON) -> "CollateralInfo":
        return cls(
            mint=PublicKey(obj["mint"]),
            oracle_symbol=symbol.Symbol.from_json(obj["oracle_symbol"]),
            decimals=obj["decimals"],
            weight=obj["weight"],
            liq_fee=obj["liq_fee"],
            is_borrowable=obj["is_borrowable"],
            optimal_util=obj["optimal_util"],
            optimal_rate=obj["optimal_rate"],
            max_rate=obj["max_rate"],
            og_fee=obj["og_fee"],
            is_swappable=obj["is_swappable"],
            serum_open_orders=PublicKey(obj["serum_open_orders"]),
            max_deposit=obj["max_deposit"],
            dust_threshold=obj["dust_threshold"],
            padding=obj["padding"],
        )
