from __future__ import annotations
from . import (
    perp_type,
)
import typing
from dataclasses import dataclass
from construct import Container
import borsh_construct as borsh


class InitPerpMarketArgsJSON(typing.TypedDict):
    symbol: str
    oracle_symbol: str
    perp_type: perp_type.PerpTypeJSON
    v_asset_lot_size: int
    v_quote_lot_size: int
    strike: int
    base_imf: int
    liq_fee: int


@dataclass
class InitPerpMarketArgs:
    layout: typing.ClassVar = borsh.CStruct(
        "symbol" / borsh.String,
        "oracle_symbol" / borsh.String,
        "perp_type" / perp_type.layout,
        "v_asset_lot_size" / borsh.U64,
        "v_quote_lot_size" / borsh.U64,
        "strike" / borsh.U64,
        "base_imf" / borsh.U16,
        "liq_fee" / borsh.U16,
    )
    symbol: str
    oracle_symbol: str
    perp_type: perp_type.PerpTypeKind
    v_asset_lot_size: int
    v_quote_lot_size: int
    strike: int
    base_imf: int
    liq_fee: int

    @classmethod
    def from_decoded(cls, obj: Container) -> "InitPerpMarketArgs":
        return cls(
            symbol=obj.symbol,
            oracle_symbol=obj.oracle_symbol,
            perp_type=perp_type.from_decoded(obj.perp_type),
            v_asset_lot_size=obj.v_asset_lot_size,
            v_quote_lot_size=obj.v_quote_lot_size,
            strike=obj.strike,
            base_imf=obj.base_imf,
            liq_fee=obj.liq_fee,
        )

    def to_encodable(self) -> dict[str, typing.Any]:
        return {
            "symbol": self.symbol,
            "oracle_symbol": self.oracle_symbol,
            "perp_type": self.perp_type.to_encodable(),
            "v_asset_lot_size": self.v_asset_lot_size,
            "v_quote_lot_size": self.v_quote_lot_size,
            "strike": self.strike,
            "base_imf": self.base_imf,
            "liq_fee": self.liq_fee,
        }

    def to_json(self) -> InitPerpMarketArgsJSON:
        return {
            "symbol": self.symbol,
            "oracle_symbol": self.oracle_symbol,
            "perp_type": self.perp_type.to_json(),
            "v_asset_lot_size": self.v_asset_lot_size,
            "v_quote_lot_size": self.v_quote_lot_size,
            "strike": self.strike,
            "base_imf": self.base_imf,
            "liq_fee": self.liq_fee,
        }

    @classmethod
    def from_json(cls, obj: InitPerpMarketArgsJSON) -> "InitPerpMarketArgs":
        return cls(
            symbol=obj["symbol"],
            oracle_symbol=obj["oracle_symbol"],
            perp_type=perp_type.from_json(obj["perp_type"]),
            v_asset_lot_size=obj["v_asset_lot_size"],
            v_quote_lot_size=obj["v_quote_lot_size"],
            strike=obj["strike"],
            base_imf=obj["base_imf"],
            liq_fee=obj["liq_fee"],
        )
