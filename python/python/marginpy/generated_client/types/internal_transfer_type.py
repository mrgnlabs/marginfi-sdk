from __future__ import annotations

import typing
from dataclasses import dataclass

import borsh_construct as borsh
from anchorpy.borsh_extension import EnumForCodegen


class InsuranceFeeJSON(typing.TypedDict):
    kind: typing.Literal["InsuranceFee"]


class ProtocolFeeJSON(typing.TypedDict):
    kind: typing.Literal["ProtocolFee"]


@dataclass
class InsuranceFee:
    discriminator: typing.ClassVar = 0
    kind: typing.ClassVar = "InsuranceFee"

    @classmethod
    def to_json(cls) -> InsuranceFeeJSON:
        return InsuranceFeeJSON(
            kind="InsuranceFee",
        )

    @classmethod
    def to_encodable(cls) -> dict:
        return {
            "InsuranceFee": {},
        }


@dataclass
class ProtocolFee:
    discriminator: typing.ClassVar = 1
    kind: typing.ClassVar = "ProtocolFee"

    @classmethod
    def to_json(cls) -> ProtocolFeeJSON:
        return ProtocolFeeJSON(
            kind="ProtocolFee",
        )

    @classmethod
    def to_encodable(cls) -> dict:
        return {
            "ProtocolFee": {},
        }


InternalTransferTypeKind = typing.Union[InsuranceFee, ProtocolFee]
InternalTransferTypeJSON = typing.Union[InsuranceFeeJSON, ProtocolFeeJSON]


def from_decoded(obj: dict) -> InternalTransferTypeKind:
    if not isinstance(obj, dict):
        raise ValueError("Invalid enum object")
    if "InsuranceFee" in obj:
        return InsuranceFee()
    if "ProtocolFee" in obj:
        return ProtocolFee()
    raise ValueError("Invalid enum object")


def from_json(obj: InternalTransferTypeJSON) -> InternalTransferTypeKind:
    if obj["kind"] == "InsuranceFee":
        return InsuranceFee()
    if obj["kind"] == "ProtocolFee":
        return ProtocolFee()
    kind = obj["kind"]
    raise ValueError(f"Unrecognized enum kind: {kind}")


layout = EnumForCodegen(
    "InsuranceFee" / borsh.CStruct(), "ProtocolFee" / borsh.CStruct()
)
