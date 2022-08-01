from __future__ import annotations

import typing
from dataclasses import dataclass

import borsh_construct as borsh
from construct import Container


class MDecimalJSON(typing.TypedDict):
    flags: int
    hi: int
    lo: int
    mid: int


@dataclass
class MDecimal:
    layout: typing.ClassVar = borsh.CStruct(
        "flags" / borsh.U32, "hi" / borsh.U32, "lo" / borsh.U32, "mid" / borsh.U32
    )
    flags: int
    hi: int
    lo: int
    mid: int

    @classmethod
    def from_decoded(cls, obj: Container) -> "MDecimal":
        return cls(flags=obj.flags, hi=obj.hi, lo=obj.lo, mid=obj.mid)

    def to_encodable(self) -> dict[str, typing.Any]:
        return {"flags": self.flags, "hi": self.hi, "lo": self.lo, "mid": self.mid}

    def to_json(self) -> MDecimalJSON:
        return {"flags": self.flags, "hi": self.hi, "lo": self.lo, "mid": self.mid}

    @classmethod
    def from_json(cls, obj: MDecimalJSON) -> "MDecimal":
        return cls(flags=obj["flags"], hi=obj["hi"], lo=obj["lo"], mid=obj["mid"])
