from __future__ import annotations

import typing
from dataclasses import dataclass

import borsh_construct as borsh
from anchorpy.borsh_extension import BorshPubkey
from construct import Container
from solana.publickey import PublicKey

from . import bank_config


class GroupConfigJSON(typing.TypedDict):
    admin: typing.Optional[str]
    bank: typing.Optional[bank_config.BankConfigJSON]
    paused: typing.Optional[bool]


@dataclass
class GroupConfig:
    layout: typing.ClassVar = borsh.CStruct(
        "admin" / borsh.Option(BorshPubkey),
        "bank" / borsh.Option(bank_config.BankConfig.layout),
        "paused" / borsh.Option(borsh.Bool),
    )
    admin: typing.Optional[PublicKey]
    bank: typing.Optional[bank_config.BankConfig]
    paused: typing.Optional[bool]

    @classmethod
    def from_decoded(cls, obj: Container) -> "GroupConfig":
        return cls(
            admin=obj.admin,
            bank=(
                None
                if obj.bank is None
                else bank_config.BankConfig.from_decoded(obj.bank)
            ),
            paused=obj.paused,
        )

    def to_encodable(self) -> dict[str, typing.Any]:
        return {
            "admin": self.admin,
            "bank": (None if self.bank is None else self.bank.to_encodable()),
            "paused": self.paused,
        }

    def to_json(self) -> GroupConfigJSON:
        return {
            "admin": (None if self.admin is None else str(self.admin)),
            "bank": (None if self.bank is None else self.bank.to_json()),
            "paused": self.paused,
        }

    @classmethod
    def from_json(cls, obj: GroupConfigJSON) -> "GroupConfig":
        return cls(
            admin=(None if obj["admin"] is None else PublicKey(obj["admin"])),
            bank=(
                None
                if obj["bank"] is None
                else bank_config.BankConfig.from_json(obj["bank"])
            ),
            paused=obj["paused"],
        )
