from __future__ import annotations

import typing
from dataclasses import dataclass

import borsh_construct as borsh
from anchorpy.borsh_extension import BorshPubkey
from construct import Container
from solana.publickey import PublicKey

from . import wrapped_i80f48


class UTPConfigJSON(typing.TypedDict):
    utp_program_id: str
    margin_requirement_deposit_buffer: wrapped_i80f48.WrappedI80F48JSON


@dataclass
class UTPConfig:
    layout: typing.ClassVar = borsh.CStruct(
        "utp_program_id" / BorshPubkey,
        "margin_requirement_deposit_buffer" / wrapped_i80f48.WrappedI80F48.layout,
    )
    utp_program_id: PublicKey
    margin_requirement_deposit_buffer: wrapped_i80f48.WrappedI80F48

    @classmethod
    def from_decoded(cls, obj: Container) -> "UTPConfig":
        return cls(
            utp_program_id=obj.utp_program_id,
            margin_requirement_deposit_buffer=wrapped_i80f48.WrappedI80F48.from_decoded(
                obj.margin_requirement_deposit_buffer
            ),
        )

    def to_encodable(self) -> dict[str, typing.Any]:
        return {
            "utp_program_id": self.utp_program_id,
            "margin_requirement_deposit_buffer": self.margin_requirement_deposit_buffer.to_encodable(),
        }

    def to_json(self) -> UTPConfigJSON:
        return {
            "utp_program_id": str(self.utp_program_id),
            "margin_requirement_deposit_buffer": self.margin_requirement_deposit_buffer.to_json(),
        }

    @classmethod
    def from_json(cls, obj: UTPConfigJSON) -> "UTPConfig":
        return cls(
            utp_program_id=PublicKey(obj["utp_program_id"]),
            margin_requirement_deposit_buffer=wrapped_i80f48.WrappedI80F48.from_json(
                obj["margin_requirement_deposit_buffer"]
            ),
        )
