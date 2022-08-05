import typing
from base64 import b64decode
from dataclasses import dataclass

import borsh_construct as borsh
from anchorpy.coder.accounts import ACCOUNT_DISCRIMINATOR_SIZE
from anchorpy.error import AccountInvalidDiscriminator
from anchorpy.utils.rpc import get_multiple_accounts
from solana.publickey import PublicKey
from solana.rpc.async_api import AsyncClient
from solana.rpc.commitment import Commitment

from ..program_id import PROGRAM_ID


class StateJSON(typing.TypedDict):
    margin_requirement_init: int
    margin_requirement_maint: int
    equity: int


@dataclass
class State:
    discriminator: typing.ClassVar = b"\xd8\x92k^hK\xb6\xb1"
    layout: typing.ClassVar = borsh.CStruct(
        "margin_requirement_init" / borsh.U128,
        "margin_requirement_maint" / borsh.U128,
        "equity" / borsh.U128,
    )
    margin_requirement_init: int
    margin_requirement_maint: int
    equity: int

    @classmethod
    async def fetch(
        cls,
        conn: AsyncClient,
        address: PublicKey,
        commitment: typing.Optional[Commitment] = None,
        program_id: PublicKey = PROGRAM_ID,
    ) -> typing.Optional["State"]:
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
    ) -> typing.List[typing.Optional["State"]]:
        infos = await get_multiple_accounts(conn, addresses, commitment=commitment)
        res: typing.List[typing.Optional["State"]] = []
        for info in infos:
            if info is None:
                res.append(None)
                continue
            if info.account.owner != program_id:
                raise ValueError("Account does not belong to this program")
            res.append(cls.decode(info.account.data))
        return res

    @classmethod
    def decode(cls, data: bytes) -> "State":
        if data[:ACCOUNT_DISCRIMINATOR_SIZE] != cls.discriminator:
            raise AccountInvalidDiscriminator(
                "The discriminator for this account is invalid"
            )
        dec = State.layout.parse(data[ACCOUNT_DISCRIMINATOR_SIZE:])
        return cls(
            margin_requirement_init=dec.margin_requirement_init,
            margin_requirement_maint=dec.margin_requirement_maint,
            equity=dec.equity,
        )

    def to_json(self) -> StateJSON:
        return {
            "margin_requirement_init": self.margin_requirement_init,
            "margin_requirement_maint": self.margin_requirement_maint,
            "equity": self.equity,
        }

    @classmethod
    def from_json(cls, obj: StateJSON) -> "State":
        return cls(
            margin_requirement_init=obj["margin_requirement_init"],
            margin_requirement_maint=obj["margin_requirement_maint"],
            equity=obj["equity"],
        )
