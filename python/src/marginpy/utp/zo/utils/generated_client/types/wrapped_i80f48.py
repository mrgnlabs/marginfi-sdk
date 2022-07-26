from __future__ import annotations
import typing
from dataclasses import dataclass
from construct import Container
import borsh_construct as borsh


class WrappedI80F48JSON(typing.TypedDict):
    data: int


@dataclass
class WrappedI80F48:
    layout: typing.ClassVar = borsh.CStruct("data" / borsh.I128)
    data: int

    @classmethod
    def from_decoded(cls, obj: Container) -> "WrappedI80F48":
        return cls(data=obj.data)

    def to_encodable(self) -> dict[str, typing.Any]:
        return {"data": self.data}

    def to_json(self) -> WrappedI80F48JSON:
        return {"data": self.data}

    @classmethod
    def from_json(cls, obj: WrappedI80F48JSON) -> "WrappedI80F48":
        return cls(data=obj["data"])
