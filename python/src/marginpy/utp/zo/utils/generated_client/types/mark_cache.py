from __future__ import annotations
from . import (
    twap_info,
    wrapped_i80f48,
)
import typing
from dataclasses import dataclass
from construct import Container
import borsh_construct as borsh


class MarkCacheJSON(typing.TypedDict):
    price: wrapped_i80f48.WrappedI80F48JSON
    twap: twap_info.TwapInfoJSON


@dataclass
class MarkCache:
    layout: typing.ClassVar = borsh.CStruct(
        "price" / wrapped_i80f48.WrappedI80F48.layout,
        "twap" / twap_info.TwapInfo.layout,
    )
    price: wrapped_i80f48.WrappedI80F48
    twap: twap_info.TwapInfo

    @classmethod
    def from_decoded(cls, obj: Container) -> "MarkCache":
        return cls(
            price=wrapped_i80f48.WrappedI80F48.from_decoded(obj.price),
            twap=twap_info.TwapInfo.from_decoded(obj.twap),
        )

    def to_encodable(self) -> dict[str, typing.Any]:
        return {"price": self.price.to_encodable(), "twap": self.twap.to_encodable()}

    def to_json(self) -> MarkCacheJSON:
        return {"price": self.price.to_json(), "twap": self.twap.to_json()}

    @classmethod
    def from_json(cls, obj: MarkCacheJSON) -> "MarkCache":
        return cls(
            price=wrapped_i80f48.WrappedI80F48.from_json(obj["price"]),
            twap=twap_info.TwapInfo.from_json(obj["twap"]),
        )
