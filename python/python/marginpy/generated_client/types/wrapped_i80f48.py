from __future__ import annotations

import typing
from dataclasses import dataclass

import borsh_construct as borsh
from construct import Container


class WrappedI80F48JSON(typing.TypedDict):
    bits: int


@dataclass
class WrappedI80F48:
    layout: typing.ClassVar = borsh.CStruct("bits" / borsh.I128)
    bits: int

    @classmethod
    def from_decoded(cls, obj: Container) -> "WrappedI80F48":
        return cls(bits=obj.bits)

    def to_encodable(self) -> dict[str, typing.Any]:
        return {"bits": self.bits}

    def to_json(self) -> WrappedI80F48JSON:
        return {"bits": self.bits}

    @classmethod
    def from_json(cls, obj: WrappedI80F48JSON) -> "WrappedI80F48":
        return cls(bits=obj["bits"])
