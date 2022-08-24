from __future__ import annotations

import typing
from dataclasses import dataclass

import borsh_construct as borsh
from anchorpy.borsh_extension import EnumForCodegen


class LiquidityVaultJSON(typing.TypedDict):
    kind: typing.Literal["LiquidityVault"]


class InsuranceVaultJSON(typing.TypedDict):
    kind: typing.Literal["InsuranceVault"]


class ProtocolFeeVaultJSON(typing.TypedDict):
    kind: typing.Literal["ProtocolFeeVault"]


@dataclass
class LiquidityVault:
    discriminator: typing.ClassVar = 0
    kind: typing.ClassVar = "LiquidityVault"

    @classmethod
    def to_json(cls) -> LiquidityVaultJSON:
        return LiquidityVaultJSON(
            kind="LiquidityVault",
        )

    @classmethod
    def to_encodable(cls) -> dict:
        return {
            "LiquidityVault": {},
        }


@dataclass
class InsuranceVault:
    discriminator: typing.ClassVar = 1
    kind: typing.ClassVar = "InsuranceVault"

    @classmethod
    def to_json(cls) -> InsuranceVaultJSON:
        return InsuranceVaultJSON(
            kind="InsuranceVault",
        )

    @classmethod
    def to_encodable(cls) -> dict:
        return {
            "InsuranceVault": {},
        }


@dataclass
class ProtocolFeeVault:
    discriminator: typing.ClassVar = 2
    kind: typing.ClassVar = "ProtocolFeeVault"

    @classmethod
    def to_json(cls) -> ProtocolFeeVaultJSON:
        return ProtocolFeeVaultJSON(
            kind="ProtocolFeeVault",
        )

    @classmethod
    def to_encodable(cls) -> dict:
        return {
            "ProtocolFeeVault": {},
        }


BankVaultTypeKind = typing.Union[LiquidityVault, InsuranceVault, ProtocolFeeVault]
BankVaultTypeJSON = typing.Union[
    LiquidityVaultJSON, InsuranceVaultJSON, ProtocolFeeVaultJSON
]


def from_decoded(obj: dict) -> BankVaultTypeKind:
    if not isinstance(obj, dict):
        raise ValueError("Invalid enum object")
    if "LiquidityVault" in obj:
        return LiquidityVault()
    if "InsuranceVault" in obj:
        return InsuranceVault()
    if "ProtocolFeeVault" in obj:
        return ProtocolFeeVault()
    raise ValueError("Invalid enum object")


def from_json(obj: BankVaultTypeJSON) -> BankVaultTypeKind:
    if obj["kind"] == "LiquidityVault":
        return LiquidityVault()
    if obj["kind"] == "InsuranceVault":
        return InsuranceVault()
    if obj["kind"] == "ProtocolFeeVault":
        return ProtocolFeeVault()
    kind = obj["kind"]
    raise ValueError(f"Unrecognized enum kind: {kind}")


layout = EnumForCodegen(
    "LiquidityVault" / borsh.CStruct(),
    "InsuranceVault" / borsh.CStruct(),
    "ProtocolFeeVault" / borsh.CStruct(),
)
