from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime

from marginpy.constants import COLLATERAL_SCALING_FACTOR


class ObservationRaw:
    timestamp: int
    free_collateral: int
    is_empty: bool
    is_rebalance_deposit_valid: bool
    max_rebalance_deposit_amount: int
    init_margin_requirement: int
    equity: int
    liquidation_value: int


@dataclass
class UtpObservation:
    """
    UtpObservation struct mirroring on-chain data.
    Contains a UTP health metrics.
    """

    timestamp: datetime
    equity: float
    free_collateral: float
    init_margin_requirement: float
    liquidation_value: float
    is_rebalance_deposit_needed: bool
    max_rebalance_deposit_amount: float
    is_empty: bool

    @staticmethod
    def from_raw(raw: ObservationRaw) -> "UtpObservation":
        return UtpObservation(
            timestamp=datetime.fromtimestamp(raw.timestamp),
            equity=raw.equity / COLLATERAL_SCALING_FACTOR,
            free_collateral=raw.free_collateral / COLLATERAL_SCALING_FACTOR,
            init_margin_requirement=raw.init_margin_requirement
            / COLLATERAL_SCALING_FACTOR,
            liquidation_value=raw.liquidation_value / COLLATERAL_SCALING_FACTOR,
            is_rebalance_deposit_needed=raw.is_rebalance_deposit_valid,
            max_rebalance_deposit_amount=raw.max_rebalance_deposit_amount
            / COLLATERAL_SCALING_FACTOR,
            is_empty=raw.is_empty,
        )

    def __repr__(self):
        return (
            f"Timestamp: {self.timestamp}"
            f"Equity: {self.equity}"
            f"Free Collateral: {self.free_collateral}"
            f"Init Margin Requirement: {self.init_margin_requirement}"
            f"Liquidation Value: {self.liquidation_value}"
            f"Rebalance Needed: {self.is_rebalance_deposit_needed}"
            f"Max Rebalance: {self.max_rebalance_deposit_amount}"
            f"Is empty: {self.is_empty}"
        )


EMPTY_OBSERVATION = UtpObservation(
    timestamp=datetime.min,
    equity=0,
    free_collateral=0,
    init_margin_requirement=0,
    liquidation_value=0,
    is_rebalance_deposit_needed=False,
    max_rebalance_deposit_amount=0,
    is_empty=False,
)
