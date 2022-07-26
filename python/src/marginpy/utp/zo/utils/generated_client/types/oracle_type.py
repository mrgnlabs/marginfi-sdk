from __future__ import annotations
import typing
from dataclasses import dataclass
from anchorpy.borsh_extension import EnumForCodegen
import borsh_construct as borsh


class NilJSON(typing.TypedDict):
    kind: typing.Literal["Nil"]


class PythJSON(typing.TypedDict):
    kind: typing.Literal["Pyth"]


class SwitchboardJSON(typing.TypedDict):
    kind: typing.Literal["Switchboard"]


@dataclass
class Nil:
    discriminator: typing.ClassVar = 0
    kind: typing.ClassVar = "Nil"

    @classmethod
    def to_json(cls) -> NilJSON:
        return NilJSON(
            kind="Nil",
        )

    @classmethod
    def to_encodable(cls) -> dict:
        return {
            "Nil": {},
        }


@dataclass
class Pyth:
    discriminator: typing.ClassVar = 1
    kind: typing.ClassVar = "Pyth"

    @classmethod
    def to_json(cls) -> PythJSON:
        return PythJSON(
            kind="Pyth",
        )

    @classmethod
    def to_encodable(cls) -> dict:
        return {
            "Pyth": {},
        }


@dataclass
class Switchboard:
    discriminator: typing.ClassVar = 2
    kind: typing.ClassVar = "Switchboard"

    @classmethod
    def to_json(cls) -> SwitchboardJSON:
        return SwitchboardJSON(
            kind="Switchboard",
        )

    @classmethod
    def to_encodable(cls) -> dict:
        return {
            "Switchboard": {},
        }


OracleTypeKind = typing.Union[Nil, Pyth, Switchboard]
OracleTypeJSON = typing.Union[NilJSON, PythJSON, SwitchboardJSON]


def from_decoded(obj: dict) -> OracleTypeKind:
    if not isinstance(obj, dict):
        raise ValueError("Invalid enum object")
    if "Nil" in obj:
        return Nil()
    if "Pyth" in obj:
        return Pyth()
    if "Switchboard" in obj:
        return Switchboard()
    raise ValueError("Invalid enum object")


def from_json(obj: OracleTypeJSON) -> OracleTypeKind:
    if obj["kind"] == "Nil":
        return Nil()
    if obj["kind"] == "Pyth":
        return Pyth()
    if obj["kind"] == "Switchboard":
        return Switchboard()
    kind = obj["kind"]
    raise ValueError(f"Unrecognized enum kind: {kind}")


layout = EnumForCodegen(
    "Nil" / borsh.CStruct(), "Pyth" / borsh.CStruct(), "Switchboard" / borsh.CStruct()
)
