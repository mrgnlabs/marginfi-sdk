from __future__ import annotations
import typing
from dataclasses import dataclass
from anchorpy.borsh_extension import EnumForCodegen
import borsh_construct as borsh


class FutureJSON(typing.TypedDict):
    kind: typing.Literal["Future"]


class CallOptionJSON(typing.TypedDict):
    kind: typing.Literal["CallOption"]


class PutOptionJSON(typing.TypedDict):
    kind: typing.Literal["PutOption"]


class SquareJSON(typing.TypedDict):
    kind: typing.Literal["Square"]


@dataclass
class Future:
    discriminator: typing.ClassVar = 0
    kind: typing.ClassVar = "Future"

    @classmethod
    def to_json(cls) -> FutureJSON:
        return FutureJSON(
            kind="Future",
        )

    @classmethod
    def to_encodable(cls) -> dict:
        return {
            "Future": {},
        }


@dataclass
class CallOption:
    discriminator: typing.ClassVar = 1
    kind: typing.ClassVar = "CallOption"

    @classmethod
    def to_json(cls) -> CallOptionJSON:
        return CallOptionJSON(
            kind="CallOption",
        )

    @classmethod
    def to_encodable(cls) -> dict:
        return {
            "CallOption": {},
        }


@dataclass
class PutOption:
    discriminator: typing.ClassVar = 2
    kind: typing.ClassVar = "PutOption"

    @classmethod
    def to_json(cls) -> PutOptionJSON:
        return PutOptionJSON(
            kind="PutOption",
        )

    @classmethod
    def to_encodable(cls) -> dict:
        return {
            "PutOption": {},
        }


@dataclass
class Square:
    discriminator: typing.ClassVar = 3
    kind: typing.ClassVar = "Square"

    @classmethod
    def to_json(cls) -> SquareJSON:
        return SquareJSON(
            kind="Square",
        )

    @classmethod
    def to_encodable(cls) -> dict:
        return {
            "Square": {},
        }


PerpTypeKind = typing.Union[Future, CallOption, PutOption, Square]
PerpTypeJSON = typing.Union[FutureJSON, CallOptionJSON, PutOptionJSON, SquareJSON]


def from_decoded(obj: dict) -> PerpTypeKind:
    if not isinstance(obj, dict):
        raise ValueError("Invalid enum object")
    if "Future" in obj:
        return Future()
    if "CallOption" in obj:
        return CallOption()
    if "PutOption" in obj:
        return PutOption()
    if "Square" in obj:
        return Square()
    raise ValueError("Invalid enum object")


def from_json(obj: PerpTypeJSON) -> PerpTypeKind:
    if obj["kind"] == "Future":
        return Future()
    if obj["kind"] == "CallOption":
        return CallOption()
    if obj["kind"] == "PutOption":
        return PutOption()
    if obj["kind"] == "Square":
        return Square()
    kind = obj["kind"]
    raise ValueError(f"Unrecognized enum kind: {kind}")


layout = EnumForCodegen(
    "Future" / borsh.CStruct(),
    "CallOption" / borsh.CStruct(),
    "PutOption" / borsh.CStruct(),
    "Square" / borsh.CStruct(),
)
