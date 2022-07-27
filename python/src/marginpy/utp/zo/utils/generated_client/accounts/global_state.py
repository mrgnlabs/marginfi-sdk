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


class GlobalStateJSON(typing.TypedDict):
    global_nonce: int
    state: str
    padding: list[int]


@dataclass
class GlobalState:
    discriminator: typing.ClassVar = b"\xa3.J\xa8\xd8{\x85b"
    layout: typing.ClassVar = borsh.CStruct(
        "global_nonce" / borsh.U8, "state" / BorshPubkey, "padding" / borsh.U8[1024]
    )
    global_nonce: int
    state: PublicKey
    padding: list[int]

    @classmethod
    async def fetch(
        cls,
        conn: AsyncClient,
        address: PublicKey,
        commitment: typing.Optional[Commitment] = None,
    ) -> typing.Optional["GlobalState"]:
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
    ) -> typing.List[typing.Optional["GlobalState"]]:
        infos = await get_multiple_accounts(conn, addresses, commitment=commitment)
        res: typing.List[typing.Optional["GlobalState"]] = []
        for info in infos:
            if info is None:
                res.append(None)
                continue
            if info.account.owner != PROGRAM_ID:
                raise ValueError("Account does not belong to this program")
            res.append(cls.decode(info.account.data))
        return res

    @classmethod
    def decode(cls, data: bytes) -> "GlobalState":
        if data[:ACCOUNT_DISCRIMINATOR_SIZE] != cls.discriminator:
            raise AccountInvalidDiscriminator(
                "The discriminator for this account is invalid"
            )
        dec = GlobalState.layout.parse(data[ACCOUNT_DISCRIMINATOR_SIZE:])
        return cls(
            global_nonce=dec.global_nonce,
            state=dec.state,
            padding=dec.padding,
        )

    def to_json(self) -> GlobalStateJSON:
        return {
            "global_nonce": self.global_nonce,
            "state": str(self.state),
            "padding": self.padding,
        }

    @classmethod
    def from_json(cls, obj: GlobalStateJSON) -> "GlobalState":
        return cls(
            global_nonce=obj["global_nonce"],
            state=PublicKey(obj["state"]),
            padding=obj["padding"],
        )
