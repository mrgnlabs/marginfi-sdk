from __future__ import annotations

import typing
from dataclasses import dataclass

import borsh_construct as borsh
from anchorpy.borsh_extension import BorshPubkey
from construct import Container
from solana.publickey import PublicKey


class UTPAccountConfigJSON(typing.TypedDict):
    address: str
    authority_seed: str
    authority_bump: int
    utp_address_book: list[str]
    reserved_space: list[int]


@dataclass
class UTPAccountConfig:
    layout: typing.ClassVar = borsh.CStruct(
        "address" / BorshPubkey,
        "authority_seed" / BorshPubkey,
        "authority_bump" / borsh.U8,
        "utp_address_book" / BorshPubkey[4],
        "reserved_space" / borsh.U32[32],
    )
    address: PublicKey
    authority_seed: PublicKey
    authority_bump: int
    utp_address_book: list[PublicKey]
    reserved_space: list[int]

    @classmethod
    def from_decoded(cls, obj: Container) -> "UTPAccountConfig":
        return cls(
            address=obj.address,
            authority_seed=obj.authority_seed,
            authority_bump=obj.authority_bump,
            utp_address_book=obj.utp_address_book,
            reserved_space=obj.reserved_space,
        )

    def to_encodable(self) -> dict[str, typing.Any]:
        return {
            "address": self.address,
            "authority_seed": self.authority_seed,
            "authority_bump": self.authority_bump,
            "utp_address_book": self.utp_address_book,
            "reserved_space": self.reserved_space,
        }

    def to_json(self) -> UTPAccountConfigJSON:
        return {
            "address": str(self.address),
            "authority_seed": str(self.authority_seed),
            "authority_bump": self.authority_bump,
            "utp_address_book": list(
                map(lambda item: str(item), self.utp_address_book)
            ),
            "reserved_space": self.reserved_space,
        }

    @classmethod
    def from_json(cls, obj: UTPAccountConfigJSON) -> "UTPAccountConfig":
        return cls(
            address=PublicKey(obj["address"]),
            authority_seed=PublicKey(obj["authority_seed"]),
            authority_bump=obj["authority_bump"],
            utp_address_book=list(
                map(lambda item: PublicKey(item), obj["utp_address_book"])
            ),
            reserved_space=obj["reserved_space"],
        )
