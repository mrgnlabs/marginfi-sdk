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


class MarginfiAccountJSON(typing.TypedDict):
    authority: str
    marginfi_group: str
    deposit_record: types.wrapped_i80f48.WrappedI80F48JSON
    borrow_record: types.wrapped_i80f48.WrappedI80F48JSON
    active_utps: list[bool]
    utp_account_config: list[types.utp_account_config.UTPAccountConfigJSON]
    reserved_space: list[int]


@dataclass
class MarginfiAccount:
    discriminator: typing.ClassVar = b"C\xb2\x82m~r\x1c*"
    layout: typing.ClassVar = borsh.CStruct(
        "authority" / BorshPubkey,
        "marginfi_group" / BorshPubkey,
        "deposit_record" / types.wrapped_i80f48.WrappedI80F48.layout,
        "borrow_record" / types.wrapped_i80f48.WrappedI80F48.layout,
        "active_utps" / borsh.Bool[32],
        "utp_account_config" / types.utp_account_config.UTPAccountConfig.layout[32],
        "reserved_space" / borsh.U128[256],
    )
    authority: PublicKey
    marginfi_group: PublicKey
    deposit_record: types.wrapped_i80f48.WrappedI80F48
    borrow_record: types.wrapped_i80f48.WrappedI80F48
    active_utps: list[bool]
    utp_account_config: list[types.utp_account_config.UTPAccountConfig]
    reserved_space: list[int]

    @classmethod
    async def fetch(
        cls,
        conn: AsyncClient,
        address: PublicKey,
        commitment: typing.Optional[Commitment] = None,
        program_id: PublicKey = PROGRAM_ID,
    ) -> typing.Optional["MarginfiAccount"]:
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
    ) -> typing.List[typing.Optional["MarginfiAccount"]]:
        infos = await get_multiple_accounts(conn, addresses, commitment=commitment)
        res: typing.List[typing.Optional["MarginfiAccount"]] = []
        for info in infos:
            if info is None:
                res.append(None)
                continue
            if info.account.owner != program_id:
                raise ValueError("Account does not belong to this program")
            res.append(cls.decode(info.account.data))
        return res

    @classmethod
    def decode(cls, data: bytes) -> "MarginfiAccount":
        if data[:ACCOUNT_DISCRIMINATOR_SIZE] != cls.discriminator:
            raise AccountInvalidDiscriminator(
                "The discriminator for this account is invalid"
            )
        dec = MarginfiAccount.layout.parse(data[ACCOUNT_DISCRIMINATOR_SIZE:])
        return cls(
            authority=dec.authority,
            marginfi_group=dec.marginfi_group,
            deposit_record=types.wrapped_i80f48.WrappedI80F48.from_decoded(
                dec.deposit_record
            ),
            borrow_record=types.wrapped_i80f48.WrappedI80F48.from_decoded(
                dec.borrow_record
            ),
            active_utps=dec.active_utps,
            utp_account_config=list(
                map(
                    lambda item: types.utp_account_config.UTPAccountConfig.from_decoded(
                        item
                    ),
                    dec.utp_account_config,
                )
            ),
            reserved_space=dec.reserved_space,
        )

    def to_json(self) -> MarginfiAccountJSON:
        return {
            "authority": str(self.authority),
            "marginfi_group": str(self.marginfi_group),
            "deposit_record": self.deposit_record.to_json(),
            "borrow_record": self.borrow_record.to_json(),
            "active_utps": self.active_utps,
            "utp_account_config": list(
                map(lambda item: item.to_json(), self.utp_account_config)
            ),
            "reserved_space": self.reserved_space,
        }

    @classmethod
    def from_json(cls, obj: MarginfiAccountJSON) -> "MarginfiAccount":
        return cls(
            authority=PublicKey(obj["authority"]),
            marginfi_group=PublicKey(obj["marginfi_group"]),
            deposit_record=types.wrapped_i80f48.WrappedI80F48.from_json(
                obj["deposit_record"]
            ),
            borrow_record=types.wrapped_i80f48.WrappedI80F48.from_json(
                obj["borrow_record"]
            ),
            active_utps=obj["active_utps"],
            utp_account_config=list(
                map(
                    lambda item: types.utp_account_config.UTPAccountConfig.from_json(
                        item
                    ),
                    obj["utp_account_config"],
                )
            ),
            reserved_space=obj["reserved_space"],
        )
