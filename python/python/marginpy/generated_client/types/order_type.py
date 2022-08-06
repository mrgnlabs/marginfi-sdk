from __future__ import annotations

import typing
from dataclasses import dataclass

import borsh_construct as borsh
from anchorpy.borsh_extension import EnumForCodegen


class LimitJSON(typing.TypedDict):
    kind: typing.Literal["Limit"]


class ImmediateOrCancelJSON(typing.TypedDict):
    kind: typing.Literal["ImmediateOrCancel"]


class PostOnlyJSON(typing.TypedDict):
    kind: typing.Literal["PostOnly"]


class ReduceOnlyIocJSON(typing.TypedDict):
    kind: typing.Literal["ReduceOnlyIoc"]


class ReduceOnlyLimitJSON(typing.TypedDict):
    kind: typing.Literal["ReduceOnlyLimit"]


class FillOrKillJSON(typing.TypedDict):
    kind: typing.Literal["FillOrKill"]


@dataclass
class Limit:
    discriminator: typing.ClassVar = 0
    kind: typing.ClassVar = "Limit"

    @classmethod
    def to_json(cls) -> LimitJSON:
        return LimitJSON(
            kind="Limit",
        )

    @classmethod
    def to_encodable(cls) -> dict:
        return {
            "Limit": {},
        }


@dataclass
class ImmediateOrCancel:
    discriminator: typing.ClassVar = 1
    kind: typing.ClassVar = "ImmediateOrCancel"

    @classmethod
    def to_json(cls) -> ImmediateOrCancelJSON:
        return ImmediateOrCancelJSON(
            kind="ImmediateOrCancel",
        )

    @classmethod
    def to_encodable(cls) -> dict:
        return {
            "ImmediateOrCancel": {},
        }


@dataclass
class PostOnly:
    discriminator: typing.ClassVar = 2
    kind: typing.ClassVar = "PostOnly"

    @classmethod
    def to_json(cls) -> PostOnlyJSON:
        return PostOnlyJSON(
            kind="PostOnly",
        )

    @classmethod
    def to_encodable(cls) -> dict:
        return {
            "PostOnly": {},
        }


@dataclass
class ReduceOnlyIoc:
    discriminator: typing.ClassVar = 3
    kind: typing.ClassVar = "ReduceOnlyIoc"

    @classmethod
    def to_json(cls) -> ReduceOnlyIocJSON:
        return ReduceOnlyIocJSON(
            kind="ReduceOnlyIoc",
        )

    @classmethod
    def to_encodable(cls) -> dict:
        return {
            "ReduceOnlyIoc": {},
        }


@dataclass
class ReduceOnlyLimit:
    discriminator: typing.ClassVar = 4
    kind: typing.ClassVar = "ReduceOnlyLimit"

    @classmethod
    def to_json(cls) -> ReduceOnlyLimitJSON:
        return ReduceOnlyLimitJSON(
            kind="ReduceOnlyLimit",
        )

    @classmethod
    def to_encodable(cls) -> dict:
        return {
            "ReduceOnlyLimit": {},
        }


@dataclass
class FillOrKill:
    discriminator: typing.ClassVar = 5
    kind: typing.ClassVar = "FillOrKill"

    @classmethod
    def to_json(cls) -> FillOrKillJSON:
        return FillOrKillJSON(
            kind="FillOrKill",
        )

    @classmethod
    def to_encodable(cls) -> dict:
        return {
            "FillOrKill": {},
        }


OrderTypeKind = typing.Union[
    Limit, ImmediateOrCancel, PostOnly, ReduceOnlyIoc, ReduceOnlyLimit, FillOrKill
]
OrderTypeJSON = typing.Union[
    LimitJSON,
    ImmediateOrCancelJSON,
    PostOnlyJSON,
    ReduceOnlyIocJSON,
    ReduceOnlyLimitJSON,
    FillOrKillJSON,
]


def from_decoded(obj: dict) -> OrderTypeKind:
    if not isinstance(obj, dict):
        raise ValueError("Invalid enum object")
    if "Limit" in obj:
        return Limit()
    if "ImmediateOrCancel" in obj:
        return ImmediateOrCancel()
    if "PostOnly" in obj:
        return PostOnly()
    if "ReduceOnlyIoc" in obj:
        return ReduceOnlyIoc()
    if "ReduceOnlyLimit" in obj:
        return ReduceOnlyLimit()
    if "FillOrKill" in obj:
        return FillOrKill()
    raise ValueError("Invalid enum object")


def from_json(obj: OrderTypeJSON) -> OrderTypeKind:
    if obj["kind"] == "Limit":
        return Limit()
    if obj["kind"] == "ImmediateOrCancel":
        return ImmediateOrCancel()
    if obj["kind"] == "PostOnly":
        return PostOnly()
    if obj["kind"] == "ReduceOnlyIoc":
        return ReduceOnlyIoc()
    if obj["kind"] == "ReduceOnlyLimit":
        return ReduceOnlyLimit()
    if obj["kind"] == "FillOrKill":
        return FillOrKill()
    kind = obj["kind"]
    raise ValueError(f"Unrecognized enum kind: {kind}")


layout = EnumForCodegen(
    "Limit" / borsh.CStruct(),
    "ImmediateOrCancel" / borsh.CStruct(),
    "PostOnly" / borsh.CStruct(),
    "ReduceOnlyIoc" / borsh.CStruct(),
    "ReduceOnlyLimit" / borsh.CStruct(),
    "FillOrKill" / borsh.CStruct(),
)
