from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime


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
    timestamp=datetime.min,  # @todo confirm this works
    equity=0,
    free_collateral=0,
    init_margin_requirement=0,
    liquidation_value=0,
    is_rebalance_deposit_needed=False,
    max_rebalance_deposit_amount=0,
    is_empty=False,
)
