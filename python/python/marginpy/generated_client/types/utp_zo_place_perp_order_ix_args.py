from __future__ import annotations

import typing
from dataclasses import dataclass

import borsh_construct as borsh
from construct import Container

from . import order_type


class UtpZoPlacePerpOrderIxArgsJSON(typing.TypedDict):
    is_long: bool
    limit_price: int
    max_base_quantity: int
    max_quote_quantity: int
    order_type: order_type.OrderTypeJSON
    limit: int
    client_id: int


@dataclass
class UtpZoPlacePerpOrderIxArgs:
    layout: typing.ClassVar = borsh.CStruct(
        "is_long" / borsh.Bool,
        "limit_price" / borsh.U64,
        "max_base_quantity" / borsh.U64,
        "max_quote_quantity" / borsh.U64,
        "order_type" / order_type.layout,
        "limit" / borsh.U16,
        "client_id" / borsh.U64,
    )
    is_long: bool
    limit_price: int
    max_base_quantity: int
    max_quote_quantity: int
    order_type: order_type.OrderTypeKind
    limit: int
    client_id: int

    @classmethod
    def from_decoded(cls, obj: Container) -> "UtpZoPlacePerpOrderIxArgs":
        return cls(
            is_long=obj.is_long,
            limit_price=obj.limit_price,
            max_base_quantity=obj.max_base_quantity,
            max_quote_quantity=obj.max_quote_quantity,
            order_type=order_type.from_decoded(obj.order_type),
            limit=obj.limit,
            client_id=obj.client_id,
        )

    def to_encodable(self) -> dict[str, typing.Any]:
        return {
            "is_long": self.is_long,
            "limit_price": self.limit_price,
            "max_base_quantity": self.max_base_quantity,
            "max_quote_quantity": self.max_quote_quantity,
            "order_type": self.order_type.to_encodable(),
            "limit": self.limit,
            "client_id": self.client_id,
        }

    def to_json(self) -> UtpZoPlacePerpOrderIxArgsJSON:
        return {
            "is_long": self.is_long,
            "limit_price": self.limit_price,
            "max_base_quantity": self.max_base_quantity,
            "max_quote_quantity": self.max_quote_quantity,
            "order_type": self.order_type.to_json(),
            "limit": self.limit,
            "client_id": self.client_id,
        }

    @classmethod
    def from_json(
        cls, obj: UtpZoPlacePerpOrderIxArgsJSON
    ) -> "UtpZoPlacePerpOrderIxArgs":
        return cls(
            is_long=obj["is_long"],
            limit_price=obj["limit_price"],
            max_base_quantity=obj["max_base_quantity"],
            max_quote_quantity=obj["max_quote_quantity"],
            order_type=order_type.from_json(obj["order_type"]),
            limit=obj["limit"],
            client_id=obj["client_id"],
        )
