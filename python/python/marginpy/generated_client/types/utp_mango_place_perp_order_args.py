from __future__ import annotations

import typing
from dataclasses import dataclass

import borsh_construct as borsh
from construct import Container

from . import mango_expiry_type, mango_order_type, mango_side


class UtpMangoPlacePerpOrderArgsJSON(typing.TypedDict):
    side: mango_side.MangoSideJSON
    price: int
    max_base_quantity: int
    max_quote_quantity: int
    client_order_id: int
    order_type: mango_order_type.MangoOrderTypeJSON
    reduce_only: bool
    expiry_timestamp: typing.Optional[int]
    limit: int
    expiry_type: mango_expiry_type.MangoExpiryTypeJSON


@dataclass
class UtpMangoPlacePerpOrderArgs:
    layout: typing.ClassVar = borsh.CStruct(
        "side" / mango_side.layout,
        "price" / borsh.I64,
        "max_base_quantity" / borsh.I64,
        "max_quote_quantity" / borsh.I64,
        "client_order_id" / borsh.U64,
        "order_type" / mango_order_type.layout,
        "reduce_only" / borsh.Bool,
        "expiry_timestamp" / borsh.Option(borsh.U64),
        "limit" / borsh.U8,
        "expiry_type" / mango_expiry_type.layout,
    )
    side: mango_side.MangoSideKind
    price: int
    max_base_quantity: int
    max_quote_quantity: int
    client_order_id: int
    order_type: mango_order_type.MangoOrderTypeKind
    reduce_only: bool
    expiry_timestamp: typing.Optional[int]
    limit: int
    expiry_type: mango_expiry_type.MangoExpiryTypeKind

    @classmethod
    def from_decoded(cls, obj: Container) -> "UtpMangoPlacePerpOrderArgs":
        return cls(
            side=mango_side.from_decoded(obj.side),
            price=obj.price,
            max_base_quantity=obj.max_base_quantity,
            max_quote_quantity=obj.max_quote_quantity,
            client_order_id=obj.client_order_id,
            order_type=mango_order_type.from_decoded(obj.order_type),
            reduce_only=obj.reduce_only,
            expiry_timestamp=obj.expiry_timestamp,
            limit=obj.limit,
            expiry_type=mango_expiry_type.from_decoded(obj.expiry_type),
        )

    def to_encodable(self) -> dict[str, typing.Any]:
        return {
            "side": self.side.to_encodable(),
            "price": self.price,
            "max_base_quantity": self.max_base_quantity,
            "max_quote_quantity": self.max_quote_quantity,
            "client_order_id": self.client_order_id,
            "order_type": self.order_type.to_encodable(),
            "reduce_only": self.reduce_only,
            "expiry_timestamp": self.expiry_timestamp,
            "limit": self.limit,
            "expiry_type": self.expiry_type.to_encodable(),
        }

    def to_json(self) -> UtpMangoPlacePerpOrderArgsJSON:
        return {
            "side": self.side.to_json(),
            "price": self.price,
            "max_base_quantity": self.max_base_quantity,
            "max_quote_quantity": self.max_quote_quantity,
            "client_order_id": self.client_order_id,
            "order_type": self.order_type.to_json(),
            "reduce_only": self.reduce_only,
            "expiry_timestamp": self.expiry_timestamp,
            "limit": self.limit,
            "expiry_type": self.expiry_type.to_json(),
        }

    @classmethod
    def from_json(
        cls, obj: UtpMangoPlacePerpOrderArgsJSON
    ) -> "UtpMangoPlacePerpOrderArgs":
        return cls(
            side=mango_side.from_json(obj["side"]),
            price=obj["price"],
            max_base_quantity=obj["max_base_quantity"],
            max_quote_quantity=obj["max_quote_quantity"],
            client_order_id=obj["client_order_id"],
            order_type=mango_order_type.from_json(obj["order_type"]),
            reduce_only=obj["reduce_only"],
            expiry_timestamp=obj["expiry_timestamp"],
            limit=obj["limit"],
            expiry_type=mango_expiry_type.from_json(obj["expiry_type"]),
        )
