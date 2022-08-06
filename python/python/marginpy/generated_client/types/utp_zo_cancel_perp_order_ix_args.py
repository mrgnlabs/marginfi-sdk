from __future__ import annotations

import typing
from dataclasses import dataclass

import borsh_construct as borsh
from construct import Container


class UtpZoCancelPerpOrderIxArgsJSON(typing.TypedDict):
    order_id: typing.Optional[int]
    is_long: typing.Optional[bool]
    client_id: typing.Optional[int]


@dataclass
class UtpZoCancelPerpOrderIxArgs:
    layout: typing.ClassVar = borsh.CStruct(
        "order_id" / borsh.Option(borsh.U128),
        "is_long" / borsh.Option(borsh.Bool),
        "client_id" / borsh.Option(borsh.U64),
    )
    order_id: typing.Optional[int]
    is_long: typing.Optional[bool]
    client_id: typing.Optional[int]

    @classmethod
    def from_decoded(cls, obj: Container) -> "UtpZoCancelPerpOrderIxArgs":
        return cls(order_id=obj.order_id, is_long=obj.is_long, client_id=obj.client_id)

    def to_encodable(self) -> dict[str, typing.Any]:
        return {
            "order_id": self.order_id,
            "is_long": self.is_long,
            "client_id": self.client_id,
        }

    def to_json(self) -> UtpZoCancelPerpOrderIxArgsJSON:
        return {
            "order_id": self.order_id,
            "is_long": self.is_long,
            "client_id": self.client_id,
        }

    @classmethod
    def from_json(
        cls, obj: UtpZoCancelPerpOrderIxArgsJSON
    ) -> "UtpZoCancelPerpOrderIxArgs":
        return cls(
            order_id=obj["order_id"], is_long=obj["is_long"], client_id=obj["client_id"]
        )
