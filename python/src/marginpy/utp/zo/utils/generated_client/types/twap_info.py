from __future__ import annotations
from . import (
    wrapped_i80f48,
)
import typing
from dataclasses import dataclass
from construct import Container
import borsh_construct as borsh


class TwapInfoJSON(typing.TypedDict):
    cumul_avg: wrapped_i80f48.WrappedI80F48JSON
    open: wrapped_i80f48.WrappedI80F48JSON
    high: wrapped_i80f48.WrappedI80F48JSON
    low: wrapped_i80f48.WrappedI80F48JSON
    close: wrapped_i80f48.WrappedI80F48JSON
    last_sample_start_time: int


@dataclass
class TwapInfo:
    layout: typing.ClassVar = borsh.CStruct(
        "cumul_avg" / wrapped_i80f48.WrappedI80F48.layout,
        "open" / wrapped_i80f48.WrappedI80F48.layout,
        "high" / wrapped_i80f48.WrappedI80F48.layout,
        "low" / wrapped_i80f48.WrappedI80F48.layout,
        "close" / wrapped_i80f48.WrappedI80F48.layout,
        "last_sample_start_time" / borsh.U64,
    )
    cumul_avg: wrapped_i80f48.WrappedI80F48
    open: wrapped_i80f48.WrappedI80F48
    high: wrapped_i80f48.WrappedI80F48
    low: wrapped_i80f48.WrappedI80F48
    close: wrapped_i80f48.WrappedI80F48
    last_sample_start_time: int

    @classmethod
    def from_decoded(cls, obj: Container) -> "TwapInfo":
        return cls(
            cumul_avg=wrapped_i80f48.WrappedI80F48.from_decoded(obj.cumul_avg),
            open=wrapped_i80f48.WrappedI80F48.from_decoded(obj.open),
            high=wrapped_i80f48.WrappedI80F48.from_decoded(obj.high),
            low=wrapped_i80f48.WrappedI80F48.from_decoded(obj.low),
            close=wrapped_i80f48.WrappedI80F48.from_decoded(obj.close),
            last_sample_start_time=obj.last_sample_start_time,
        )

    def to_encodable(self) -> dict[str, typing.Any]:
        return {
            "cumul_avg": self.cumul_avg.to_encodable(),
            "open": self.open.to_encodable(),
            "high": self.high.to_encodable(),
            "low": self.low.to_encodable(),
            "close": self.close.to_encodable(),
            "last_sample_start_time": self.last_sample_start_time,
        }

    def to_json(self) -> TwapInfoJSON:
        return {
            "cumul_avg": self.cumul_avg.to_json(),
            "open": self.open.to_json(),
            "high": self.high.to_json(),
            "low": self.low.to_json(),
            "close": self.close.to_json(),
            "last_sample_start_time": self.last_sample_start_time,
        }

    @classmethod
    def from_json(cls, obj: TwapInfoJSON) -> "TwapInfo":
        return cls(
            cumul_avg=wrapped_i80f48.WrappedI80F48.from_json(obj["cumul_avg"]),
            open=wrapped_i80f48.WrappedI80F48.from_json(obj["open"]),
            high=wrapped_i80f48.WrappedI80F48.from_json(obj["high"]),
            low=wrapped_i80f48.WrappedI80F48.from_json(obj["low"]),
            close=wrapped_i80f48.WrappedI80F48.from_json(obj["close"]),
            last_sample_start_time=obj["last_sample_start_time"],
        )
