from __future__ import annotations
import typing
from dataclasses import dataclass
from construct import Container
from solana.publickey import PublicKey
from anchorpy.borsh_extension import BorshPubkey
import borsh_construct as borsh


class OpenOrdersInfoJSON(typing.TypedDict):
    key: str
    native_pc_total: int
    pos_size: int
    realized_pnl: int
    coin_on_bids: int
    coin_on_asks: int
    order_count: int
    funding_index: int


@dataclass
class OpenOrdersInfo:
    layout: typing.ClassVar = borsh.CStruct(
        "key" / BorshPubkey,
        "native_pc_total" / borsh.I64,
        "pos_size" / borsh.I64,
        "realized_pnl" / borsh.I64,
        "coin_on_bids" / borsh.U64,
        "coin_on_asks" / borsh.U64,
        "order_count" / borsh.U8,
        "funding_index" / borsh.I128,
    )
    key: PublicKey
    native_pc_total: int
    pos_size: int
    realized_pnl: int
    coin_on_bids: int
    coin_on_asks: int
    order_count: int
    funding_index: int

    @classmethod
    def from_decoded(cls, obj: Container) -> "OpenOrdersInfo":
        return cls(
            key=obj.key,
            native_pc_total=obj.native_pc_total,
            pos_size=obj.pos_size,
            realized_pnl=obj.realized_pnl,
            coin_on_bids=obj.coin_on_bids,
            coin_on_asks=obj.coin_on_asks,
            order_count=obj.order_count,
            funding_index=obj.funding_index,
        )

    def to_encodable(self) -> dict[str, typing.Any]:
        return {
            "key": self.key,
            "native_pc_total": self.native_pc_total,
            "pos_size": self.pos_size,
            "realized_pnl": self.realized_pnl,
            "coin_on_bids": self.coin_on_bids,
            "coin_on_asks": self.coin_on_asks,
            "order_count": self.order_count,
            "funding_index": self.funding_index,
        }

    def to_json(self) -> OpenOrdersInfoJSON:
        return {
            "key": str(self.key),
            "native_pc_total": self.native_pc_total,
            "pos_size": self.pos_size,
            "realized_pnl": self.realized_pnl,
            "coin_on_bids": self.coin_on_bids,
            "coin_on_asks": self.coin_on_asks,
            "order_count": self.order_count,
            "funding_index": self.funding_index,
        }

    @classmethod
    def from_json(cls, obj: OpenOrdersInfoJSON) -> "OpenOrdersInfo":
        return cls(
            key=PublicKey(obj["key"]),
            native_pc_total=obj["native_pc_total"],
            pos_size=obj["pos_size"],
            realized_pnl=obj["realized_pnl"],
            coin_on_bids=obj["coin_on_bids"],
            coin_on_asks=obj["coin_on_asks"],
            order_count=obj["order_count"],
            funding_index=obj["funding_index"],
        )
