import typing
from base64 import b64decode
from dataclasses import dataclass

import borsh_construct as borsh
from anchorpy.borsh_extension import BorshPubkey
from anchorpy.coder.accounts import ACCOUNT_DISCRIMINATOR_SIZE
from anchorpy.error import AccountInvalidDiscriminator
from anchorpy.utils.rpc import get_multiple_accounts
from solana.publickey import PublicKey
from solana.rpc.async_api import AsyncClient
from solana.rpc.commitment import Commitment

from .. import types
from ..program_id import PROGRAM_ID


class MarginfiGroupJSON(typing.TypedDict):
    admin: str
    bank: types.bank.BankJSON
    paused: bool
    reserved_space: list[int]


@dataclass
class MarginfiGroup:
    discriminator: typing.ClassVar = b"\xb6\x17\xad\xf0\x97\xce\xb6C"
    layout: typing.ClassVar = borsh.CStruct(
        "admin" / BorshPubkey,
        "bank" / types.bank.Bank.layout,
        "paused" / borsh.Bool,
        "reserved_space" / borsh.U128[384],
    )
    admin: PublicKey
    bank: types.bank.Bank
    paused: bool
    reserved_space: list[int]

    @classmethod
    async def fetch(
        cls,
        conn: AsyncClient,
        address: PublicKey,
        commitment: typing.Optional[Commitment] = None,
        program_id: PublicKey = PROGRAM_ID,
    ) -> typing.Optional["MarginfiGroup"]:
        resp = await conn.get_account_info(address, commitment=commitment)
        info = resp["result"]["value"]
        if info is None:
            return None
        if info["owner"] != str(program_id):
            raise ValueError("Account does not belong to this program")
        bytes_data = b64decode(info["data"][0])
        return cls.decode(bytes_data)

    @classmethod
    async def fetch_multiple(
        cls,
        conn: AsyncClient,
        addresses: list[PublicKey],
        commitment: typing.Optional[Commitment] = None,
        program_id: PublicKey = PROGRAM_ID,
    ) -> typing.List[typing.Optional["MarginfiGroup"]]:
        infos = await get_multiple_accounts(conn, addresses, commitment=commitment)
        res: typing.List[typing.Optional["MarginfiGroup"]] = []
        for info in infos:
            if info is None:
                res.append(None)
                continue
            if info.account.owner != program_id:
                raise ValueError("Account does not belong to this program")
            res.append(cls.decode(info.account.data))
        return res

    @classmethod
    def decode(cls, data: bytes) -> "MarginfiGroup":
        if data[:ACCOUNT_DISCRIMINATOR_SIZE] != cls.discriminator:
            raise AccountInvalidDiscriminator(
                "The discriminator for this account is invalid"
            )
        dec = MarginfiGroup.layout.parse(data[ACCOUNT_DISCRIMINATOR_SIZE:])
        return cls(
            admin=dec.admin,
            bank=types.bank.Bank.from_decoded(dec.bank),
            paused=dec.paused,
            reserved_space=dec.reserved_space,
        )

    def to_json(self) -> MarginfiGroupJSON:
        return {
            "admin": str(self.admin),
            "bank": self.bank.to_json(),
            "paused": self.paused,
            "reserved_space": self.reserved_space,
        }

    @classmethod
    def from_json(cls, obj: MarginfiGroupJSON) -> "MarginfiGroup":
        return cls(
            admin=PublicKey(obj["admin"]),
            bank=types.bank.Bank.from_json(obj["bank"]),
            paused=obj["paused"],
            reserved_space=obj["reserved_space"],
        )
