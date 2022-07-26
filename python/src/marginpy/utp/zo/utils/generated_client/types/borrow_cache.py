from __future__ import annotations
from . import (
    wrapped_i80f48,
)
import typing
from dataclasses import dataclass
from construct import Container
import borsh_construct as borsh


class BorrowCacheJSON(typing.TypedDict):
    supply: wrapped_i80f48.WrappedI80F48JSON
    borrows: wrapped_i80f48.WrappedI80F48JSON
    supply_multiplier: wrapped_i80f48.WrappedI80F48JSON
    borrow_multiplier: wrapped_i80f48.WrappedI80F48JSON
    last_updated: int


@dataclass
class BorrowCache:
    layout: typing.ClassVar = borsh.CStruct(
        "supply" / wrapped_i80f48.WrappedI80F48.layout,
        "borrows" / wrapped_i80f48.WrappedI80F48.layout,
        "supply_multiplier" / wrapped_i80f48.WrappedI80F48.layout,
        "borrow_multiplier" / wrapped_i80f48.WrappedI80F48.layout,
        "last_updated" / borsh.U64,
    )
    supply: wrapped_i80f48.WrappedI80F48
    borrows: wrapped_i80f48.WrappedI80F48
    supply_multiplier: wrapped_i80f48.WrappedI80F48
    borrow_multiplier: wrapped_i80f48.WrappedI80F48
    last_updated: int

    @classmethod
    def from_decoded(cls, obj: Container) -> "BorrowCache":
        return cls(
            supply=wrapped_i80f48.WrappedI80F48.from_decoded(obj.supply),
            borrows=wrapped_i80f48.WrappedI80F48.from_decoded(obj.borrows),
            supply_multiplier=wrapped_i80f48.WrappedI80F48.from_decoded(
                obj.supply_multiplier
            ),
            borrow_multiplier=wrapped_i80f48.WrappedI80F48.from_decoded(
                obj.borrow_multiplier
            ),
            last_updated=obj.last_updated,
        )

    def to_encodable(self) -> dict[str, typing.Any]:
        return {
            "supply": self.supply.to_encodable(),
            "borrows": self.borrows.to_encodable(),
            "supply_multiplier": self.supply_multiplier.to_encodable(),
            "borrow_multiplier": self.borrow_multiplier.to_encodable(),
            "last_updated": self.last_updated,
        }

    def to_json(self) -> BorrowCacheJSON:
        return {
            "supply": self.supply.to_json(),
            "borrows": self.borrows.to_json(),
            "supply_multiplier": self.supply_multiplier.to_json(),
            "borrow_multiplier": self.borrow_multiplier.to_json(),
            "last_updated": self.last_updated,
        }

    @classmethod
    def from_json(cls, obj: BorrowCacheJSON) -> "BorrowCache":
        return cls(
            supply=wrapped_i80f48.WrappedI80F48.from_json(obj["supply"]),
            borrows=wrapped_i80f48.WrappedI80F48.from_json(obj["borrows"]),
            supply_multiplier=wrapped_i80f48.WrappedI80F48.from_json(
                obj["supply_multiplier"]
            ),
            borrow_multiplier=wrapped_i80f48.WrappedI80F48.from_json(
                obj["borrow_multiplier"]
            ),
            last_updated=obj["last_updated"],
        )
