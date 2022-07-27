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


class StateJSON(typing.TypedDict):
    signer_nonce: int
    admin: str
    cache: str
    swap_fee_vault: str
    insurance: int
    fees_accrued: list[int]
    vaults: list[str]
    collaterals: list[types.collateral_info.CollateralInfoJSON]
    perp_markets: list[types.perp_market_info.PerpMarketInfoJSON]
    total_collaterals: int
    total_markets: int
    padding: list[int]


@dataclass
class State:
    discriminator: typing.ClassVar = b"\xd8\x92k^hK\xb6\xb1"
    layout: typing.ClassVar = borsh.CStruct(
        "signer_nonce" / borsh.U8,
        "admin" / BorshPubkey,
        "cache" / BorshPubkey,
        "swap_fee_vault" / BorshPubkey,
        "insurance" / borsh.U64,
        "fees_accrued" / borsh.U64[25],
        "vaults" / BorshPubkey[25],
        "collaterals" / types.collateral_info.CollateralInfo.layout[25],
        "perp_markets" / types.perp_market_info.PerpMarketInfo.layout[50],
        "total_collaterals" / borsh.U16,
        "total_markets" / borsh.U16,
        "padding" / borsh.U8[1280],
    )
    signer_nonce: int
    admin: PublicKey
    cache: PublicKey
    swap_fee_vault: PublicKey
    insurance: int
    fees_accrued: list[int]
    vaults: list[PublicKey]
    collaterals: list[types.collateral_info.CollateralInfo]
    perp_markets: list[types.perp_market_info.PerpMarketInfo]
    total_collaterals: int
    total_markets: int
    padding: list[int]

    @classmethod
    async def fetch(
        cls,
        conn: AsyncClient,
        address: PublicKey,
        commitment: typing.Optional[Commitment] = None,
    ) -> typing.Optional["State"]:
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
    ) -> typing.List[typing.Optional["State"]]:
        infos = await get_multiple_accounts(conn, addresses, commitment=commitment)
        res: typing.List[typing.Optional["State"]] = []
        for info in infos:
            if info is None:
                res.append(None)
                continue
            if info.account.owner != PROGRAM_ID:
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
            signer_nonce=dec.signer_nonce,
            admin=dec.admin,
            cache=dec.cache,
            swap_fee_vault=dec.swap_fee_vault,
            insurance=dec.insurance,
            fees_accrued=dec.fees_accrued,
            vaults=dec.vaults,
            collaterals=list(
                map(
                    lambda item: types.collateral_info.CollateralInfo.from_decoded(
                        item
                    ),
                    dec.collaterals,
                )
            ),
            perp_markets=list(
                map(
                    lambda item: types.perp_market_info.PerpMarketInfo.from_decoded(
                        item
                    ),
                    dec.perp_markets,
                )
            ),
            total_collaterals=dec.total_collaterals,
            total_markets=dec.total_markets,
            padding=dec.padding,
        )

    def to_json(self) -> StateJSON:
        return {
            "signer_nonce": self.signer_nonce,
            "admin": str(self.admin),
            "cache": str(self.cache),
            "swap_fee_vault": str(self.swap_fee_vault),
            "insurance": self.insurance,
            "fees_accrued": self.fees_accrued,
            "vaults": list(map(lambda item: str(item), self.vaults)),
            "collaterals": list(map(lambda item: item.to_json(), self.collaterals)),
            "perp_markets": list(map(lambda item: item.to_json(), self.perp_markets)),
            "total_collaterals": self.total_collaterals,
            "total_markets": self.total_markets,
            "padding": self.padding,
        }

    @classmethod
    def from_json(cls, obj: StateJSON) -> "State":
        return cls(
            signer_nonce=obj["signer_nonce"],
            admin=PublicKey(obj["admin"]),
            cache=PublicKey(obj["cache"]),
            swap_fee_vault=PublicKey(obj["swap_fee_vault"]),
            insurance=obj["insurance"],
            fees_accrued=obj["fees_accrued"],
            vaults=list(map(lambda item: PublicKey(item), obj["vaults"])),
            collaterals=list(
                map(
                    lambda item: types.collateral_info.CollateralInfo.from_json(item),
                    obj["collaterals"],
                )
            ),
            perp_markets=list(
                map(
                    lambda item: types.perp_market_info.PerpMarketInfo.from_json(item),
                    obj["perp_markets"],
                )
            ),
            total_collaterals=obj["total_collaterals"],
            total_markets=obj["total_markets"],
            padding=obj["padding"],
        )
