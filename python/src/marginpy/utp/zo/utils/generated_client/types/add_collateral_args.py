from __future__ import annotations
import typing
from dataclasses import dataclass
from construct import Container
import borsh_construct as borsh


class AddCollateralArgsJSON(typing.TypedDict):
    oracle_symbol: str
    weight: int
    is_borrowable: bool
    optimal_util: int
    optimal_rate: int
    max_rate: int
    liq_fee: int
    og_fee: int
    max_deposit: int
    dust_threshold: int


@dataclass
class AddCollateralArgs:
    layout: typing.ClassVar = borsh.CStruct(
        "oracle_symbol" / borsh.String,
        "weight" / borsh.U16,
        "is_borrowable" / borsh.Bool,
        "optimal_util" / borsh.U16,
        "optimal_rate" / borsh.U16,
        "max_rate" / borsh.U16,
        "liq_fee" / borsh.U16,
        "og_fee" / borsh.U16,
        "max_deposit" / borsh.U64,
        "dust_threshold" / borsh.U16,
    )
    oracle_symbol: str
    weight: int
    is_borrowable: bool
    optimal_util: int
    optimal_rate: int
    max_rate: int
    liq_fee: int
    og_fee: int
    max_deposit: int
    dust_threshold: int

    @classmethod
    def from_decoded(cls, obj: Container) -> "AddCollateralArgs":
        return cls(
            oracle_symbol=obj.oracle_symbol,
            weight=obj.weight,
            is_borrowable=obj.is_borrowable,
            optimal_util=obj.optimal_util,
            optimal_rate=obj.optimal_rate,
            max_rate=obj.max_rate,
            liq_fee=obj.liq_fee,
            og_fee=obj.og_fee,
            max_deposit=obj.max_deposit,
            dust_threshold=obj.dust_threshold,
        )

    def to_encodable(self) -> dict[str, typing.Any]:
        return {
            "oracle_symbol": self.oracle_symbol,
            "weight": self.weight,
            "is_borrowable": self.is_borrowable,
            "optimal_util": self.optimal_util,
            "optimal_rate": self.optimal_rate,
            "max_rate": self.max_rate,
            "liq_fee": self.liq_fee,
            "og_fee": self.og_fee,
            "max_deposit": self.max_deposit,
            "dust_threshold": self.dust_threshold,
        }

    def to_json(self) -> AddCollateralArgsJSON:
        return {
            "oracle_symbol": self.oracle_symbol,
            "weight": self.weight,
            "is_borrowable": self.is_borrowable,
            "optimal_util": self.optimal_util,
            "optimal_rate": self.optimal_rate,
            "max_rate": self.max_rate,
            "liq_fee": self.liq_fee,
            "og_fee": self.og_fee,
            "max_deposit": self.max_deposit,
            "dust_threshold": self.dust_threshold,
        }

    @classmethod
    def from_json(cls, obj: AddCollateralArgsJSON) -> "AddCollateralArgs":
        return cls(
            oracle_symbol=obj["oracle_symbol"],
            weight=obj["weight"],
            is_borrowable=obj["is_borrowable"],
            optimal_util=obj["optimal_util"],
            optimal_rate=obj["optimal_rate"],
            max_rate=obj["max_rate"],
            liq_fee=obj["liq_fee"],
            og_fee=obj["og_fee"],
            max_deposit=obj["max_deposit"],
            dust_threshold=obj["dust_threshold"],
        )
