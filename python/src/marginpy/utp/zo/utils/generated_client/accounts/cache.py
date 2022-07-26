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
from ..program_id import PROGRAM_ID
from .. import types


class CacheJSON(typing.TypedDict):
    oracles: list[types.oracle_cache.OracleCacheJSON]
    marks: list[types.mark_cache.MarkCacheJSON]
    funding_cache: list[int]
    borrow_cache: list[types.borrow_cache.BorrowCacheJSON]


@dataclass
class Cache:
    discriminator: typing.ClassVar = b"J\xe5\xd6\xbc\xcb\xdc\x16\x99"
    layout: typing.ClassVar = borsh.CStruct(
        "oracles" / types.oracle_cache.OracleCache.layout[25],
        "marks" / types.mark_cache.MarkCache.layout[50],
        "funding_cache" / borsh.I128[50],
        "borrow_cache" / types.borrow_cache.BorrowCache.layout[25],
    )
    oracles: list[types.oracle_cache.OracleCache]
    marks: list[types.mark_cache.MarkCache]
    funding_cache: list[int]
    borrow_cache: list[types.borrow_cache.BorrowCache]

    @classmethod
    async def fetch(
        cls,
        conn: AsyncClient,
        address: PublicKey,
        commitment: typing.Optional[Commitment] = None,
    ) -> typing.Optional["Cache"]:
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
    ) -> typing.List[typing.Optional["Cache"]]:
        infos = await get_multiple_accounts(conn, addresses, commitment=commitment)
        res: typing.List[typing.Optional["Cache"]] = []
        for info in infos:
            if info is None:
                res.append(None)
                continue
            if info.account.owner != PROGRAM_ID:
                raise ValueError("Account does not belong to this program")
            res.append(cls.decode(info.account.data))
        return res

    @classmethod
    def decode(cls, data: bytes) -> "Cache":
        if data[:ACCOUNT_DISCRIMINATOR_SIZE] != cls.discriminator:
            raise AccountInvalidDiscriminator(
                "The discriminator for this account is invalid"
            )
        dec = Cache.layout.parse(data[ACCOUNT_DISCRIMINATOR_SIZE:])
        return cls(
            oracles=list(
                map(
                    lambda item: types.oracle_cache.OracleCache.from_decoded(item),
                    dec.oracles,
                )
            ),
            marks=list(
                map(
                    lambda item: types.mark_cache.MarkCache.from_decoded(item),
                    dec.marks,
                )
            ),
            funding_cache=dec.funding_cache,
            borrow_cache=list(
                map(
                    lambda item: types.borrow_cache.BorrowCache.from_decoded(item),
                    dec.borrow_cache,
                )
            ),
        )

    def to_json(self) -> CacheJSON:
        return {
            "oracles": list(map(lambda item: item.to_json(), self.oracles)),
            "marks": list(map(lambda item: item.to_json(), self.marks)),
            "funding_cache": self.funding_cache,
            "borrow_cache": list(map(lambda item: item.to_json(), self.borrow_cache)),
        }

    @classmethod
    def from_json(cls, obj: CacheJSON) -> "Cache":
        return cls(
            oracles=list(
                map(
                    lambda item: types.oracle_cache.OracleCache.from_json(item),
                    obj["oracles"],
                )
            ),
            marks=list(
                map(
                    lambda item: types.mark_cache.MarkCache.from_json(item),
                    obj["marks"],
                )
            ),
            funding_cache=obj["funding_cache"],
            borrow_cache=list(
                map(
                    lambda item: types.borrow_cache.BorrowCache.from_json(item),
                    obj["borrow_cache"],
                )
            ),
        )
