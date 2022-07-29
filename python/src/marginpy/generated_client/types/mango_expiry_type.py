from __future__ import annotations

import typing
from dataclasses import dataclass

import borsh_construct as borsh
from anchorpy.borsh_extension import EnumForCodegen


class AbsoluteJSON(typing.TypedDict):
    kind: typing.Literal["Absolute"]


class RelativeJSON(typing.TypedDict):
    kind: typing.Literal["Relative"]


@dataclass
class Absolute:
    discriminator: typing.ClassVar = 0
    kind: typing.ClassVar = "Absolute"

    @classmethod
    def to_json(cls) -> AbsoluteJSON:
        return AbsoluteJSON(
            kind="Absolute",
        )

    @classmethod
    def to_encodable(cls) -> dict:
        return {
            "Absolute": {},
        }


@dataclass
class Relative:
    discriminator: typing.ClassVar = 1
    kind: typing.ClassVar = "Relative"

    @classmethod
    def to_json(cls) -> RelativeJSON:
        return RelativeJSON(
            kind="Relative",
        )

    @classmethod
    def to_encodable(cls) -> dict:
        return {
            "Relative": {},
        }


MangoExpiryTypeKind = typing.Union[Absolute, Relative]
MangoExpiryTypeJSON = typing.Union[AbsoluteJSON, RelativeJSON]


def from_decoded(obj: dict) -> MangoExpiryTypeKind:
    if not isinstance(obj, dict):
        raise ValueError("Invalid enum object")
    if "Absolute" in obj:
        return Absolute()
    if "Relative" in obj:
        return Relative()
    raise ValueError("Invalid enum object")


def from_json(obj: MangoExpiryTypeJSON) -> MangoExpiryTypeKind:
    if obj["kind"] == "Absolute":
        return Absolute()
    if obj["kind"] == "Relative":
        return Relative()
    kind = obj["kind"]
    raise ValueError(f"Unrecognized enum kind: {kind}")


layout = EnumForCodegen("Absolute" / borsh.CStruct(), "Relative" / borsh.CStruct())
