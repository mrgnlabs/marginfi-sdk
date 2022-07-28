from __future__ import annotations

import typing
from dataclasses import dataclass

import borsh_construct as borsh
from anchorpy.borsh_extension import EnumForCodegen


class BidJSON(typing.TypedDict):
    kind: typing.Literal["Bid"]


class AskJSON(typing.TypedDict):
    kind: typing.Literal["Ask"]


@dataclass
class Bid:
    discriminator: typing.ClassVar = 0
    kind: typing.ClassVar = "Bid"

    @classmethod
    def to_json(cls) -> BidJSON:
        return BidJSON(
            kind="Bid",
        )

    @classmethod
    def to_encodable(cls) -> dict:
        return {
            "Bid": {},
        }


@dataclass
class Ask:
    discriminator: typing.ClassVar = 1
    kind: typing.ClassVar = "Ask"

    @classmethod
    def to_json(cls) -> AskJSON:
        return AskJSON(
            kind="Ask",
        )

    @classmethod
    def to_encodable(cls) -> dict:
        return {
            "Ask": {},
        }


MangoSideKind = typing.Union[Bid, Ask]
MangoSideJSON = typing.Union[BidJSON, AskJSON]


def from_decoded(obj: dict) -> MangoSideKind:
    if not isinstance(obj, dict):
        raise ValueError("Invalid enum object")
    if "Bid" in obj:
        return Bid()
    if "Ask" in obj:
        return Ask()
    raise ValueError("Invalid enum object")


def from_json(obj: MangoSideJSON) -> MangoSideKind:
    if obj["kind"] == "Bid":
        return Bid()
    if obj["kind"] == "Ask":
        return Ask()
    kind = obj["kind"]
    raise ValueError(f"Unrecognized enum kind: {kind}")


layout = EnumForCodegen("Bid" / borsh.CStruct(), "Ask" / borsh.CStruct())
