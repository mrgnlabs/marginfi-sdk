from dataclasses import dataclass


@dataclass
class IUtpObservation:
    timestamp #@todo dd type
    equity: float #@todo confirm datatypes
    free_collateral: float
    init_margin_requirement: float
    liquidation_value: float
    is_rebalance_deposit_needed: bool
    max_rebalance_deposit_amount: float
    is_empty: bool    

class UtpObservation:
    """
    UtpObservation struct mirroring on-chain data.
    Contains a UTP health metrics.
    """
    timestamp #@todo dd type
    equity: float #@todo confirm datatypes
    free_collateral: float
    init_margin_requirement: float
    liquidation_value: float
    is_rebalance_deposit_needed: bool
    max_rebalance_deposit_amount: float
    is_empty: bool

    @classmethod
    def EMPTY_OBSERVATION(cls):
        return UtpObservation(
            timestamp=0, #@todo fix
            equity=0,
            free_collateral=0,
            init_margin_requirement=0,
            max_rebalance_deposit_amount=0,
            liquidation_value=0,
            is_empty=False,
            is_rebalance_deposit_needed=False,
        )

    def __init__(self, data: IUtpObservation):
        self.timestamp = data.timestamp
        self.equity = data.equity
        self.free_collateral = data.free_collateral
        self.init_margin_requirement = data.init_margin_requirement
        self.liquidation_value = data.liquidation_value
        self.is_rebalance_deposit_needed = data.is_rebalance_deposit_needed
        self.max_rebalance_deposit_amount = data.max_rebalance_deposit_amount
        self.is_empty = data.is_empty

    def to_string(self):
        return(
            f"Timestamp: {self.timestamp}\nEquity: {self.equity}\nFree Collateral: {self.free_collateral}\nInit Margin Requirement: {self.init_margin_requirement}\nLiquidation Value: {self.liquidation_value}\nRebalance Needed: {self.is_rebalance_deposit_needed}\nMax Rebalance: {self.max_rebalance_deposit_amount}\nIs empty: {self.is_empty}"
        )
