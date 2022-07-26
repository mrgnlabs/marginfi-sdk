from __future__ import annotations
from . import (
    symbol,
    perp_type,
)
import typing
from dataclasses import dataclass
from construct import Container
from solana.publickey import PublicKey
from anchorpy.borsh_extension import BorshPubkey
import borsh_construct as borsh


class PerpMarketInfoJSON(typing.TypedDict):
    symbol: symbol.SymbolJSON
    oracle_symbol: symbol.SymbolJSON
    perp_type: perp_type.PerpTypeJSON
    asset_decimals: int
    asset_lot_size: int
    quote_lot_size: int
    strike: int
    base_imf: int
    liq_fee: int
    dex_market: str
    padding: list[int]


@dataclass
class PerpMarketInfo:
    layout: typing.ClassVar = borsh.CStruct(
        "symbol" / symbol.Symbol.layout,
        "oracle_symbol" / symbol.Symbol.layout,
        "perp_type" / perp_type.layout,
        "asset_decimals" / borsh.U8,
        "asset_lot_size" / borsh.U64,
        "quote_lot_size" / borsh.U64,
        "strike" / borsh.U64,
        "base_imf" / borsh.U16,
        "liq_fee" / borsh.U16,
        "dex_market" / BorshPubkey,
        "padding" / borsh.U8[320],
    )
    symbol: symbol.Symbol
    oracle_symbol: symbol.Symbol
    perp_type: perp_type.PerpTypeKind
    asset_decimals: int
    asset_lot_size: int
    quote_lot_size: int
    strike: int
    base_imf: int
    liq_fee: int
    dex_market: PublicKey
    padding: list[int]

    @classmethod
    def from_decoded(cls, obj: Container) -> "PerpMarketInfo":
        return cls(
            symbol=symbol.Symbol.from_decoded(obj.symbol),
            oracle_symbol=symbol.Symbol.from_decoded(obj.oracle_symbol),
            perp_type=perp_type.from_decoded(obj.perp_type),
            asset_decimals=obj.asset_decimals,
            asset_lot_size=obj.asset_lot_size,
            quote_lot_size=obj.quote_lot_size,
            strike=obj.strike,
            base_imf=obj.base_imf,
            liq_fee=obj.liq_fee,
            dex_market=obj.dex_market,
            padding=obj.padding,
        )

    def to_encodable(self) -> dict[str, typing.Any]:
        return {
            "symbol": self.symbol.to_encodable(),
            "oracle_symbol": self.oracle_symbol.to_encodable(),
            "perp_type": self.perp_type.to_encodable(),
            "asset_decimals": self.asset_decimals,
            "asset_lot_size": self.asset_lot_size,
            "quote_lot_size": self.quote_lot_size,
            "strike": self.strike,
            "base_imf": self.base_imf,
            "liq_fee": self.liq_fee,
            "dex_market": self.dex_market,
            "padding": self.padding,
        }

    def to_json(self) -> PerpMarketInfoJSON:
        return {
            "symbol": self.symbol.to_json(),
            "oracle_symbol": self.oracle_symbol.to_json(),
            "perp_type": self.perp_type.to_json(),
            "asset_decimals": self.asset_decimals,
            "asset_lot_size": self.asset_lot_size,
            "quote_lot_size": self.quote_lot_size,
            "strike": self.strike,
            "base_imf": self.base_imf,
            "liq_fee": self.liq_fee,
            "dex_market": str(self.dex_market),
            "padding": self.padding,
        }

    @classmethod
    def from_json(cls, obj: PerpMarketInfoJSON) -> "PerpMarketInfo":
        return cls(
            symbol=symbol.Symbol.from_json(obj["symbol"]),
            oracle_symbol=symbol.Symbol.from_json(obj["oracle_symbol"]),
            perp_type=perp_type.from_json(obj["perp_type"]),
            asset_decimals=obj["asset_decimals"],
            asset_lot_size=obj["asset_lot_size"],
            quote_lot_size=obj["quote_lot_size"],
            strike=obj["strike"],
            base_imf=obj["base_imf"],
            liq_fee=obj["liq_fee"],
            dex_market=PublicKey(obj["dex_market"]),
            padding=obj["padding"],
        )
