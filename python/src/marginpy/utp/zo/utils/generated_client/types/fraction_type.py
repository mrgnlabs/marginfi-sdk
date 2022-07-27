from __future__ import annotations
import typing
from dataclasses import dataclass
from anchorpy.borsh_extension import EnumForCodegen
import borsh_construct as borsh


class MaintenanceJSON(typing.TypedDict):
    kind: typing.Literal["Maintenance"]


class InitialJSON(typing.TypedDict):
    kind: typing.Literal["Initial"]


class CancelJSON(typing.TypedDict):
    kind: typing.Literal["Cancel"]


@dataclass
class Maintenance:
    discriminator: typing.ClassVar = 0
    kind: typing.ClassVar = "Maintenance"

    @classmethod
    def to_json(cls) -> MaintenanceJSON:
        return MaintenanceJSON(
            kind="Maintenance",
        )

    @classmethod
    def to_encodable(cls) -> dict:
        return {
            "Maintenance": {},
        }


@dataclass
class Initial:
    discriminator: typing.ClassVar = 1
    kind: typing.ClassVar = "Initial"

    @classmethod
    def to_json(cls) -> InitialJSON:
        return InitialJSON(
            kind="Initial",
        )

    @classmethod
    def to_encodable(cls) -> dict:
        return {
            "Initial": {},
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


FractionTypeKind = typing.Union[Maintenance, Initial, Cancel]
FractionTypeJSON = typing.Union[MaintenanceJSON, InitialJSON, CancelJSON]


def from_decoded(obj: dict) -> FractionTypeKind:
    if not isinstance(obj, dict):
        raise ValueError("Invalid enum object")
    if "Maintenance" in obj:
        return Maintenance()
    if "Initial" in obj:
        return Initial()
    if "Cancel" in obj:
        return Cancel()
    raise ValueError("Invalid enum object")


def from_json(obj: FractionTypeJSON) -> FractionTypeKind:
    if obj["kind"] == "Maintenance":
        return Maintenance()
    if obj["kind"] == "Initial":
        return Initial()
    if obj["kind"] == "Cancel":
        return Cancel()
    kind = obj["kind"]
    raise ValueError(f"Unrecognized enum kind: {kind}")


layout = EnumForCodegen(
    "Maintenance" / borsh.CStruct(),
    "Initial" / borsh.CStruct(),
    "Cancel" / borsh.CStruct(),
)
