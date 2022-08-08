from __future__ import annotations

import typing
from dataclasses import dataclass

import borsh_construct as borsh
from anchorpy.borsh_extension import EnumForCodegen


class InitJSON(typing.TypedDict):
    kind: typing.Literal["Init"]


class PartialLiquidationJSON(typing.TypedDict):
    kind: typing.Literal["PartialLiquidation"]


class MaintJSON(typing.TypedDict):
    kind: typing.Literal["Maint"]


@dataclass
class Init:
    discriminator: typing.ClassVar = 0
    kind: typing.ClassVar = "Init"

    @classmethod
    def to_json(cls) -> InitJSON:
        return InitJSON(
            kind="Init",
        )

    @classmethod
    def to_encodable(cls) -> dict:
        return {
            "Init": {},
        }


@dataclass
class PartialLiquidation:
    discriminator: typing.ClassVar = 1
    kind: typing.ClassVar = "PartialLiquidation"

    @classmethod
    def to_json(cls) -> PartialLiquidationJSON:
        return PartialLiquidationJSON(
            kind="PartialLiquidation",
        )

    @classmethod
    def to_encodable(cls) -> dict:
        return {
            "PartialLiquidation": {},
        }


@dataclass
class Maint:
    discriminator: typing.ClassVar = 2
    kind: typing.ClassVar = "Maint"

    @classmethod
    def to_json(cls) -> MaintJSON:
        return MaintJSON(
            kind="Maint",
        )

    @classmethod
    def to_encodable(cls) -> dict:
        return {
            "Maint": {},
        }


MarginRequirementKind = typing.Union[Init, PartialLiquidation, Maint]
MarginRequirementJSON = typing.Union[InitJSON, PartialLiquidationJSON, MaintJSON]


def from_decoded(obj: dict) -> MarginRequirementKind:
    if not isinstance(obj, dict):
        raise ValueError("Invalid enum object")
    if "Init" in obj:
        return Init()
    if "PartialLiquidation" in obj:
        return PartialLiquidation()
    if "Maint" in obj:
        return Maint()
    raise ValueError("Invalid enum object")


def from_json(obj: MarginRequirementJSON) -> MarginRequirementKind:
    if obj["kind"] == "Init":
        return Init()
    if obj["kind"] == "PartialLiquidation":
        return PartialLiquidation()
    if obj["kind"] == "Maint":
        return Maint()
    kind = obj["kind"]
    raise ValueError(f"Unrecognized enum kind: {kind}")


layout = EnumForCodegen(
    "Init" / borsh.CStruct(),
    "PartialLiquidation" / borsh.CStruct(),
    "Maint" / borsh.CStruct(),
)
