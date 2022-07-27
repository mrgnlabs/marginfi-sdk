from __future__ import annotations
from . import (
    oracle_source,
    symbol,
    wrapped_i80f48,
)
import typing
from dataclasses import dataclass
from construct import Container
import borsh_construct as borsh


class OracleCacheJSON(typing.TypedDict):
    symbol: symbol.SymbolJSON
    sources: list[oracle_source.OracleSourceJSON]
    last_updated: int
    price: wrapped_i80f48.WrappedI80F48JSON
    twap: wrapped_i80f48.WrappedI80F48JSON
    base_decimals: int
    quote_decimals: int


@dataclass
class OracleCache:
    layout: typing.ClassVar = borsh.CStruct(
        "symbol" / symbol.Symbol.layout,
        "sources" / oracle_source.OracleSource.layout[3],
        "last_updated" / borsh.U64,
        "price" / wrapped_i80f48.WrappedI80F48.layout,
        "twap" / wrapped_i80f48.WrappedI80F48.layout,
        "base_decimals" / borsh.U8,
        "quote_decimals" / borsh.U8,
    )
    symbol: symbol.Symbol
    sources: list[oracle_source.OracleSource]
    last_updated: int
    price: wrapped_i80f48.WrappedI80F48
    twap: wrapped_i80f48.WrappedI80F48
    base_decimals: int
    quote_decimals: int

    @classmethod
    def from_decoded(cls, obj: Container) -> "OracleCache":
        return cls(
            symbol=symbol.Symbol.from_decoded(obj.symbol),
            sources=list(
                map(
                    lambda item: oracle_source.OracleSource.from_decoded(item),
                    obj.sources,
                )
            ),
            last_updated=obj.last_updated,
            price=wrapped_i80f48.WrappedI80F48.from_decoded(obj.price),
            twap=wrapped_i80f48.WrappedI80F48.from_decoded(obj.twap),
            base_decimals=obj.base_decimals,
            quote_decimals=obj.quote_decimals,
        )

    def to_encodable(self) -> dict[str, typing.Any]:
        return {
            "symbol": self.symbol.to_encodable(),
            "sources": list(map(lambda item: item.to_encodable(), self.sources)),
            "last_updated": self.last_updated,
            "price": self.price.to_encodable(),
            "twap": self.twap.to_encodable(),
            "base_decimals": self.base_decimals,
            "quote_decimals": self.quote_decimals,
        }

    def to_json(self) -> OracleCacheJSON:
        return {
            "symbol": self.symbol.to_json(),
            "sources": list(map(lambda item: item.to_json(), self.sources)),
            "last_updated": self.last_updated,
            "price": self.price.to_json(),
            "twap": self.twap.to_json(),
            "base_decimals": self.base_decimals,
            "quote_decimals": self.quote_decimals,
        }

    @classmethod
    def from_json(cls, obj: OracleCacheJSON) -> "OracleCache":
        return cls(
            symbol=symbol.Symbol.from_json(obj["symbol"]),
            sources=list(
                map(
                    lambda item: oracle_source.OracleSource.from_json(item),
                    obj["sources"],
                )
            ),
            last_updated=obj["last_updated"],
            price=wrapped_i80f48.WrappedI80F48.from_json(obj["price"]),
            twap=wrapped_i80f48.WrappedI80F48.from_json(obj["twap"]),
            base_decimals=obj["base_decimals"],
            quote_decimals=obj["quote_decimals"],
        )
