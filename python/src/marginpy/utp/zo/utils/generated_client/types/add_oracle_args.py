from __future__ import annotations
from . import (
    oracle_type,
)
import typing
from dataclasses import dataclass
from construct import Container, Construct
import borsh_construct as borsh


class AddOracleArgsJSON(typing.TypedDict):
    symbol: str
    base_decimals: int
    quote_decimals: int
    oracle_types: list[oracle_type.OracleTypeJSON]


@dataclass
class AddOracleArgs:
    layout: typing.ClassVar = borsh.CStruct(
        "symbol" / borsh.String,
        "base_decimals" / borsh.U8,
        "quote_decimals" / borsh.U8,
        "oracle_types" / borsh.Vec(typing.cast(Construct, oracle_type.layout)),
    )
    symbol: str
    base_decimals: int
    quote_decimals: int
    oracle_types: list[oracle_type.OracleTypeKind]

    @classmethod
    def from_decoded(cls, obj: Container) -> "AddOracleArgs":
        return cls(
            symbol=obj.symbol,
            base_decimals=obj.base_decimals,
            quote_decimals=obj.quote_decimals,
            oracle_types=list(
                map(lambda item: oracle_type.from_decoded(item), obj.oracle_types)
            ),
        )

    def to_encodable(self) -> dict[str, typing.Any]:
        return {
            "symbol": self.symbol,
            "base_decimals": self.base_decimals,
            "quote_decimals": self.quote_decimals,
            "oracle_types": list(
                map(lambda item: item.to_encodable(), self.oracle_types)
            ),
        }

    def to_json(self) -> AddOracleArgsJSON:
        return {
            "symbol": self.symbol,
            "base_decimals": self.base_decimals,
            "quote_decimals": self.quote_decimals,
            "oracle_types": list(map(lambda item: item.to_json(), self.oracle_types)),
        }

    @classmethod
    def from_json(cls, obj: AddOracleArgsJSON) -> "AddOracleArgs":
        return cls(
            symbol=obj["symbol"],
            base_decimals=obj["base_decimals"],
            quote_decimals=obj["quote_decimals"],
            oracle_types=list(
                map(lambda item: oracle_type.from_json(item), obj["oracle_types"])
            ),
        )
