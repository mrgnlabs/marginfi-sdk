from __future__ import annotations
from . import (
    wrapped_i80f48,
)
import typing
from dataclasses import dataclass
from construct import Container
import borsh_construct as borsh


class OraclePriceJSON(typing.TypedDict):
    price: wrapped_i80f48.WrappedI80F48JSON
    twap: wrapped_i80f48.WrappedI80F48JSON


@dataclass
class OraclePrice:
    layout: typing.ClassVar = borsh.CStruct(
        "price" / wrapped_i80f48.WrappedI80F48.layout,
        "twap" / wrapped_i80f48.WrappedI80F48.layout,
    )
    price: wrapped_i80f48.WrappedI80F48
    twap: wrapped_i80f48.WrappedI80F48

    @classmethod
    def from_decoded(cls, obj: Container) -> "OraclePrice":
        return cls(
            price=wrapped_i80f48.WrappedI80F48.from_decoded(obj.price),
            twap=wrapped_i80f48.WrappedI80F48.from_decoded(obj.twap),
        )

    def to_encodable(self) -> dict[str, typing.Any]:
        return {"price": self.price.to_encodable(), "twap": self.twap.to_encodable()}

    def to_json(self) -> OraclePriceJSON:
        return {"price": self.price.to_json(), "twap": self.twap.to_json()}

    @classmethod
    def from_json(cls, obj: OraclePriceJSON) -> "OraclePrice":
        return cls(
            price=wrapped_i80f48.WrappedI80F48.from_json(obj["price"]),
            twap=wrapped_i80f48.WrappedI80F48.from_json(obj["twap"]),
        )
