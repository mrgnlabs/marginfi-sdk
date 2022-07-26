from __future__ import annotations
import typing
from dataclasses import dataclass
from anchorpy.borsh_extension import EnumForCodegen
import borsh_construct as borsh


class ImfJSON(typing.TypedDict):
    kind: typing.Literal["Imf"]


class MmfJSON(typing.TypedDict):
    kind: typing.Literal["Mmf"]


class CancelJSON(typing.TypedDict):
    kind: typing.Literal["Cancel"]


class BothJSON(typing.TypedDict):
    kind: typing.Literal["Both"]


@dataclass
class Imf:
    discriminator: typing.ClassVar = 0
    kind: typing.ClassVar = "Imf"

    @classmethod
    def to_json(cls) -> ImfJSON:
        return ImfJSON(
            kind="Imf",
        )

    @classmethod
    def to_encodable(cls) -> dict:
        return {
            "Imf": {},
        }


@dataclass
class Mmf:
    discriminator: typing.ClassVar = 1
    kind: typing.ClassVar = "Mmf"

    @classmethod
    def to_json(cls) -> MmfJSON:
        return MmfJSON(
            kind="Mmf",
        )

    @classmethod
    def to_encodable(cls) -> dict:
        return {
            "Mmf": {},
        }


@dataclass
class Cancel:
    discriminator: typing.ClassVar = 2
    kind: typing.ClassVar = "Cancel"

    @classmethod
    def to_json(cls) -> CancelJSON:
        return CancelJSON(
            kind="Cancel",
        )

    @classmethod
    def to_encodable(cls) -> dict:
        return {
            "Cancel": {},
        }


@dataclass
class Both:
    discriminator: typing.ClassVar = 3
    kind: typing.ClassVar = "Both"

    @classmethod
    def to_json(cls) -> BothJSON:
        return BothJSON(
            kind="Both",
        )

    @classmethod
    def to_encodable(cls) -> dict:
        return {
            "Both": {},
        }


MfReturnOptionKind = typing.Union[Imf, Mmf, Cancel, Both]
MfReturnOptionJSON = typing.Union[ImfJSON, MmfJSON, CancelJSON, BothJSON]


def from_decoded(obj: dict) -> MfReturnOptionKind:
    if not isinstance(obj, dict):
        raise ValueError("Invalid enum object")
    if "Imf" in obj:
        return Imf()
    if "Mmf" in obj:
        return Mmf()
    if "Cancel" in obj:
        return Cancel()
    if "Both" in obj:
        return Both()
    raise ValueError("Invalid enum object")


def from_json(obj: MfReturnOptionJSON) -> MfReturnOptionKind:
    if obj["kind"] == "Imf":
        return Imf()
    if obj["kind"] == "Mmf":
        return Mmf()
    if obj["kind"] == "Cancel":
        return Cancel()
    if obj["kind"] == "Both":
        return Both()
    kind = obj["kind"]
    raise ValueError(f"Unrecognized enum kind: {kind}")


layout = EnumForCodegen(
    "Imf" / borsh.CStruct(),
    "Mmf" / borsh.CStruct(),
    "Cancel" / borsh.CStruct(),
    "Both" / borsh.CStruct(),
)
