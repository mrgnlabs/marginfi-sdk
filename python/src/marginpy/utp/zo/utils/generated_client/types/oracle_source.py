from __future__ import annotations
from . import (
    oracle_type,
)
import typing
from dataclasses import dataclass
from construct import Container
from solana.publickey import PublicKey
from anchorpy.borsh_extension import BorshPubkey
import borsh_construct as borsh


class OracleSourceJSON(typing.TypedDict):
    ty: oracle_type.OracleTypeJSON
    key: str


@dataclass
class OracleSource:
    layout: typing.ClassVar = borsh.CStruct(
        "ty" / oracle_type.layout, "key" / BorshPubkey
    )
    ty: oracle_type.OracleTypeKind
    key: PublicKey

    @classmethod
    def from_decoded(cls, obj: Container) -> "OracleSource":
        return cls(ty=oracle_type.from_decoded(obj.ty), key=obj.key)

    def to_encodable(self) -> dict[str, typing.Any]:
        return {"ty": self.ty.to_encodable(), "key": self.key}

    def to_json(self) -> OracleSourceJSON:
        return {"ty": self.ty.to_json(), "key": str(self.key)}

    @classmethod
    def from_json(cls, obj: OracleSourceJSON) -> "OracleSource":
        return cls(ty=oracle_type.from_json(obj["ty"]), key=PublicKey(obj["key"]))
