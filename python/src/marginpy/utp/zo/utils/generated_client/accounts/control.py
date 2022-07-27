import typing
from dataclasses import dataclass
from base64 import b64decode
from solana.publickey import PublicKey
from solana.rpc.async_api import AsyncClient
from solana.rpc.commitment import Commitment
import borsh_construct as borsh
from anchorpy.coder.accounts import ACCOUNT_DISCRIMINATOR_SIZE
from anchorpy.error import AccountInvalidDiscriminator
from anchorpy.utils.rpc import get_multiple_accounts
from anchorpy.borsh_extension import BorshPubkey
from ..program_id import PROGRAM_ID
from .. import types


class ControlJSON(typing.TypedDict):
    authority: str
    open_orders_agg: list[types.open_orders_info.OpenOrdersInfoJSON]


@dataclass
class Control:
    discriminator: typing.ClassVar = b"=\nB\xf6*\xf0\x7f("
    layout: typing.ClassVar = borsh.CStruct(
        "authority" / BorshPubkey,
        "open_orders_agg" / types.open_orders_info.OpenOrdersInfo.layout[50],
    )
    authority: PublicKey
    open_orders_agg: list[types.open_orders_info.OpenOrdersInfo]

    @classmethod
    async def fetch(
        cls,
        conn: AsyncClient,
        address: PublicKey,
        commitment: typing.Optional[Commitment] = None,
    ) -> typing.Optional["Control"]:
        resp = await conn.get_account_info(address, commitment=commitment)
        info = resp["result"]["value"]
        if info is None:
            return None
        if info["owner"] != str(PROGRAM_ID):
            raise ValueError("Account does not belong to this program")
        bytes_data = b64decode(info["data"][0])
        return cls.decode(bytes_data)

    @classmethod
    async def fetch_multiple(
        cls,
        conn: AsyncClient,
        addresses: list[PublicKey],
        commitment: typing.Optional[Commitment] = None,
    ) -> typing.List[typing.Optional["Control"]]:
        infos = await get_multiple_accounts(conn, addresses, commitment=commitment)
        res: typing.List[typing.Optional["Control"]] = []
        for info in infos:
            if info is None:
                res.append(None)
                continue
            if info.account.owner != PROGRAM_ID:
                raise ValueError("Account does not belong to this program")
            res.append(cls.decode(info.account.data))
        return res

    @classmethod
    def decode(cls, data: bytes) -> "Control":
        if data[:ACCOUNT_DISCRIMINATOR_SIZE] != cls.discriminator:
            raise AccountInvalidDiscriminator(
                "The discriminator for this account is invalid"
            )
        dec = Control.layout.parse(data[ACCOUNT_DISCRIMINATOR_SIZE:])
        return cls(
            authority=dec.authority,
            open_orders_agg=list(
                map(
                    lambda item: types.open_orders_info.OpenOrdersInfo.from_decoded(
                        item
                    ),
                    dec.open_orders_agg,
                )
            ),
        )

    def to_json(self) -> ControlJSON:
        return {
            "authority": str(self.authority),
            "open_orders_agg": list(
                map(lambda item: item.to_json(), self.open_orders_agg)
            ),
        }

    @classmethod
    def from_json(cls, obj: ControlJSON) -> "Control":
        return cls(
            authority=PublicKey(obj["authority"]),
            open_orders_agg=list(
                map(
                    lambda item: types.open_orders_info.OpenOrdersInfo.from_json(item),
                    obj["open_orders_agg"],
                )
            ),
        )
