from __future__ import annotations

import typing
from dataclasses import dataclass

import borsh_construct as borsh
from anchorpy.borsh_extension import EnumForCodegen


class InitReqAdjustedJSON(typing.TypedDict):
    kind: typing.Literal["InitReqAdjusted"]


class TotalJSON(typing.TypedDict):
    kind: typing.Literal["Total"]


@dataclass
class InitReqAdjusted:
    discriminator: typing.ClassVar = 0
    kind: typing.ClassVar = "InitReqAdjusted"

    @classmethod
    def to_json(cls) -> InitReqAdjustedJSON:
        return InitReqAdjustedJSON(
            kind="InitReqAdjusted",
        )

    @classmethod
    def to_encodable(cls) -> dict:
        return {
            "InitReqAdjusted": {},
        }


@dataclass
class Total:
    discriminator: typing.ClassVar = 1
    kind: typing.ClassVar = "Total"

    @classmethod
    def to_json(cls) -> TotalJSON:
        return TotalJSON(
            kind="Total",
        )

    @classmethod
    def to_encodable(cls) -> dict:
        return {
            "Total": {},
        }


EquityTypeKind = typing.Union[InitReqAdjusted, Total]
EquityTypeJSON = typing.Union[InitReqAdjustedJSON, TotalJSON]


def from_decoded(obj: dict) -> EquityTypeKind:
    if not isinstance(obj, dict):
        raise ValueError("Invalid enum object")
    if "InitReqAdjusted" in obj:
        return InitReqAdjusted()
    if "Total" in obj:
        return Total()
    raise ValueError("Invalid enum object")


def from_json(obj: EquityTypeJSON) -> EquityTypeKind:
    if obj["kind"] == "InitReqAdjusted":
        return InitReqAdjusted()
    if obj["kind"] == "Total":
        return Total()
    kind = obj["kind"]
    raise ValueError(f"Unrecognized enum kind: {kind}")


layout = EnumForCodegen("InitReqAdjusted" / borsh.CStruct(), "Total" / borsh.CStruct())
