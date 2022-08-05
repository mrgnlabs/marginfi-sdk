from __future__ import annotations

import typing
from dataclasses import dataclass

import borsh_construct as borsh
from anchorpy.borsh_extension import EnumForCodegen


class BorrowJSON(typing.TypedDict):
    kind: typing.Literal["Borrow"]


class DepositJSON(typing.TypedDict):
    kind: typing.Literal["Deposit"]


@dataclass
class Borrow:
    discriminator: typing.ClassVar = 0
    kind: typing.ClassVar = "Borrow"

    @classmethod
    def to_json(cls) -> BorrowJSON:
        return BorrowJSON(
            kind="Borrow",
        )

    @classmethod
    def to_encodable(cls) -> dict:
        return {
            "Borrow": {},
        }


@dataclass
class Deposit:
    discriminator: typing.ClassVar = 1
    kind: typing.ClassVar = "Deposit"

    @classmethod
    def to_json(cls) -> DepositJSON:
        return DepositJSON(
            kind="Deposit",
        )

    @classmethod
    def to_encodable(cls) -> dict:
        return {
            "Deposit": {},
        }


LendingSideKind = typing.Union[Borrow, Deposit]
LendingSideJSON = typing.Union[BorrowJSON, DepositJSON]


def from_decoded(obj: dict) -> LendingSideKind:
    if not isinstance(obj, dict):
        raise ValueError("Invalid enum object")
    if "Borrow" in obj:
        return Borrow()
    if "Deposit" in obj:
        return Deposit()
    raise ValueError("Invalid enum object")


def from_json(obj: LendingSideJSON) -> LendingSideKind:
    if obj["kind"] == "Borrow":
        return Borrow()
    if obj["kind"] == "Deposit":
        return Deposit()
    kind = obj["kind"]
    raise ValueError(f"Unrecognized enum kind: {kind}")


layout = EnumForCodegen("Borrow" / borsh.CStruct(), "Deposit" / borsh.CStruct())
