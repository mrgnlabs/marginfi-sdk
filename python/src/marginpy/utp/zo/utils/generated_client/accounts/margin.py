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


class MarginJSON(typing.TypedDict):
    nonce: int
    authority: str
    collateral: list[types.wrapped_i80f48.WrappedI80F48JSON]
    control: str
    padding: list[int]


@dataclass
class Margin:
    discriminator: typing.ClassVar = b"\x98\x11\x8e\xc3P\xc4\xa10"
    layout: typing.ClassVar = borsh.CStruct(
        "nonce" / borsh.U8,
        "authority" / BorshPubkey,
        "collateral" / types.wrapped_i80f48.WrappedI80F48.layout[25],
        "control" / BorshPubkey,
        "padding" / borsh.U8[320],
    )
    nonce: int
    authority: PublicKey
    collateral: list[types.wrapped_i80f48.WrappedI80F48]
    control: PublicKey
    padding: list[int]

    @classmethod
    async def fetch(
        cls,
        conn: AsyncClient,
        address: PublicKey,
        commitment: typing.Optional[Commitment] = None,
    ) -> typing.Optional["Margin"]:
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
    ) -> typing.List[typing.Optional["Margin"]]:
        infos = await get_multiple_accounts(conn, addresses, commitment=commitment)
        res: typing.List[typing.Optional["Margin"]] = []
        for info in infos:
            if info is None:
                res.append(None)
                continue
            if info.account.owner != PROGRAM_ID:
                raise ValueError("Account does not belong to this program")
            res.append(cls.decode(info.account.data))
        return res

    @classmethod
    def decode(cls, data: bytes) -> "Margin":
        if data[:ACCOUNT_DISCRIMINATOR_SIZE] != cls.discriminator:
            raise AccountInvalidDiscriminator(
                "The discriminator for this account is invalid"
            )
        dec = Margin.layout.parse(data[ACCOUNT_DISCRIMINATOR_SIZE:])
        return cls(
            nonce=dec.nonce,
            authority=dec.authority,
            collateral=list(
                map(
                    lambda item: types.wrapped_i80f48.WrappedI80F48.from_decoded(item),
                    dec.collateral,
                )
            ),
            control=dec.control,
            padding=dec.padding,
        )

    def to_json(self) -> MarginJSON:
        return {
            "nonce": self.nonce,
            "authority": str(self.authority),
            "collateral": list(map(lambda item: item.to_json(), self.collateral)),
            "control": str(self.control),
            "padding": self.padding,
        }

    @classmethod
    def from_json(cls, obj: MarginJSON) -> "Margin":
        return cls(
            nonce=obj["nonce"],
            authority=PublicKey(obj["authority"]),
            collateral=list(
                map(
                    lambda item: types.wrapped_i80f48.WrappedI80F48.from_json(item),
                    obj["collateral"],
                )
            ),
            control=PublicKey(obj["control"]),
            padding=obj["padding"],
        )
