import typing
from anchorpy.error import ProgramError


class MathFailure(ProgramError):
    def __init__(self) -> None:
        super().__init__(6000, "A math failure occured, likely due to overflow")

    code = 6000
    name = "MathFailure"
    msg = "A math failure occured, likely due to overflow"


class InsufficientFunds(ProgramError):
    def __init__(self) -> None:
        super().__init__(
            6001, "The amount you are withdrawing exceeds the available collateral"
        )

    code = 6001
    name = "InsufficientFunds"
    msg = "The amount you are withdrawing exceeds the available collateral"


class Unauthorized(ProgramError):
    def __init__(self) -> None:
        super().__init__(6002, "Unauthorized to perform the operation")

    code = 6002
    name = "Unauthorized"
    msg = "Unauthorized to perform the operation"


class InvalidArgument(ProgramError):
    def __init__(self) -> None:
        super().__init__(6003, "Arguments passed were invalid")

    code = 6003
    name = "InvalidArgument"
    msg = "Arguments passed were invalid"


class InvalidMint(ProgramError):
    def __init__(self) -> None:
        super().__init__(6004, "Invalid mint for transaction")

    code = 6004
    name = "InvalidMint"
    msg = "Invalid mint for transaction"


class InvalidOrderState(ProgramError):
    def __init__(self) -> None:
        super().__init__(6005, "Everlasting account state is invalid")

    code = 6005
    name = "InvalidOrderState"
    msg = "Everlasting account state is invalid"


class BelowMarginMaintenance(ProgramError):
    def __init__(self) -> None:
        super().__init__(6006, "Going below Margin maintenance")

    code = 6006
    name = "BelowMarginMaintenance"
    msg = "Going below Margin maintenance"


class AboveMMF(ProgramError):
    def __init__(self) -> None:
        super().__init__(6007, "Above Margin maintenance")

    code = 6007
    name = "AboveMMF"
    msg = "Above Margin maintenance"


class PositionValueCalculationFailure(ProgramError):
    def __init__(self) -> None:
        super().__init__(6008, "Couldn't calculate the position value")

    code = 6008
    name = "PositionValueCalculationFailure"
    msg = "Couldn't calculate the position value"


class InvalidPythAccount(ProgramError):
    def __init__(self) -> None:
        super().__init__(6009, "Pyth account is invalid")

    code = 6009
    name = "InvalidPythAccount"
    msg = "Pyth account is invalid"


class IncompleteLiquidation(ProgramError):
    def __init__(self) -> None:
        super().__init__(6010, "Liquidation has not fully completed")

    code = 6010
    name = "IncompleteLiquidation"
    msg = "Liquidation has not fully completed"


class NotMarkedLiquidate(ProgramError):
    def __init__(self) -> None:
        super().__init__(6011, "The account has not been marked for liquidation")

    code = 6011
    name = "NotMarkedLiquidate"
    msg = "The account has not been marked for liquidation"


class UnderLiquidation(ProgramError):
    def __init__(self) -> None:
        super().__init__(6012, "Account is under liquidation")

    code = 6012
    name = "UnderLiquidation"
    msg = "Account is under liquidation"


class LoadDexMarketFailure(ProgramError):
    def __init__(self) -> None:
        super().__init__(6013, "Failed to load dex market")

    code = 6013
    name = "LoadDexMarketFailure"
    msg = "Failed to load dex market"


class LoadOpenOrdersFailure(ProgramError):
    def __init__(self) -> None:
        super().__init__(6014, "Failed to load open orders")

    code = 6014
    name = "LoadOpenOrdersFailure"
    msg = "Failed to load open orders"


class CalculateMarginRatioFailure(ProgramError):
    def __init__(self) -> None:
        super().__init__(6015, "Failed to calculate margin ratio")

    code = 6015
    name = "CalculateMarginRatioFailure"
    msg = "Failed to calculate margin ratio"


class BelowInitialMarginFraction(ProgramError):
    def __init__(self) -> None:
        super().__init__(
            6016, "Current margin fraction is below position initial margin fraction"
        )

    code = 6016
    name = "BelowInitialMarginFraction"
    msg = "Current margin fraction is below position initial margin fraction"


class NoPositionToLiquidate(ProgramError):
    def __init__(self) -> None:
        super().__init__(6017, "No active positions to close")

    code = 6017
    name = "NoPositionToLiquidate"
    msg = "No active positions to close"


class CollateralAlreadyExists(ProgramError):
    def __init__(self) -> None:
        super().__init__(
            6018, "The collateral pair already exists in the collateral array"
        )

    code = 6018
    name = "CollateralAlreadyExists"
    msg = "The collateral pair already exists in the collateral array"


class CollateralAtCapacity(ProgramError):
    def __init__(self) -> None:
        super().__init__(6019, "The collateral array is at full capacity")

    code = 6019
    name = "CollateralAtCapacity"
    msg = "The collateral array is at full capacity"


class CollateralDoesNotExist(ProgramError):
    def __init__(self) -> None:
        super().__init__(
            6020, "The collateral pair does not exist in the collateral array"
        )

    code = 6020
    name = "CollateralDoesNotExist"
    msg = "The collateral pair does not exist in the collateral array"


class DexMarketKeyAlreadyExists(ProgramError):
    def __init__(self) -> None:
        super().__init__(
            6021, "The DEX Market key already exists in perp markets array"
        )

    code = 6021
    name = "DexMarketKeyAlreadyExists"
    msg = "The DEX Market key already exists in perp markets array"


class SymbolAlreadyExists(ProgramError):
    def __init__(self) -> None:
        super().__init__(6022, "The symbol already exists in perp markets array")

    code = 6022
    name = "SymbolAlreadyExists"
    msg = "The symbol already exists in perp markets array"


class MarketsAtCapacity(ProgramError):
    def __init__(self) -> None:
        super().__init__(6023, "The perp markets array is at full capacity")

    code = 6023
    name = "MarketsAtCapacity"
    msg = "The perp markets array is at full capacity"


class InvalidVault(ProgramError):
    def __init__(self) -> None:
        super().__init__(6024, "The given vault does not match the state vault")

    code = 6024
    name = "InvalidVault"
    msg = "The given vault does not match the state vault"


class InvalidDexMarketKey(ProgramError):
    def __init__(self) -> None:
        super().__init__(
            6025,
            "The given DEX market key does not match any keys in the perp markets array",
        )

    code = 6025
    name = "InvalidDexMarketKey"
    msg = "The given DEX market key does not match any keys in the perp markets array"


class OpenOrdersAlreadyInitialized(ProgramError):
    def __init__(self) -> None:
        super().__init__(6026, "The open orders account is already initialized")

    code = 6026
    name = "OpenOrdersAlreadyInitialized"
    msg = "The open orders account is already initialized"


class InvalidLimitPrice(ProgramError):
    def __init__(self) -> None:
        super().__init__(6027, "The limit price is invalid")

    code = 6027
    name = "InvalidLimitPrice"
    msg = "The limit price is invalid"


class InvalidMaxBaseQuantity(ProgramError):
    def __init__(self) -> None:
        super().__init__(6028, "The max base quantity is invalid")

    code = 6028
    name = "InvalidMaxBaseQuantity"
    msg = "The max base quantity is invalid"


class InvalidMaxQuoteQuantity(ProgramError):
    def __init__(self) -> None:
        super().__init__(6029, "The max quote quantity is invalid")

    code = 6029
    name = "InvalidMaxQuoteQuantity"
    msg = "The max quote quantity is invalid"


class OracleAlreadyExists(ProgramError):
    def __init__(self) -> None:
        super().__init__(6030, "The oracle already exists in the oracle cache")

    code = 6030
    name = "OracleAlreadyExists"
    msg = "The oracle already exists in the oracle cache"


class OracleCacheFull(ProgramError):
    def __init__(self) -> None:
        super().__init__(6031, "Oracle cache is at full capacity")

    code = 6031
    name = "OracleCacheFull"
    msg = "Oracle cache is at full capacity"


class OracleDoesNotExist(ProgramError):
    def __init__(self) -> None:
        super().__init__(6032, "The given oracle does not exist")

    code = 6032
    name = "OracleDoesNotExist"
    msg = "The given oracle does not exist"


class InvalidOracleKey(ProgramError):
    def __init__(self) -> None:
        super().__init__(6033, "The given oracle key is invalid")

    code = 6033
    name = "InvalidOracleKey"
    msg = "The given oracle key is invalid"


class InvalidOracleType(ProgramError):
    def __init__(self) -> None:
        super().__init__(6034, "The given oracle type is invalid")

    code = 6034
    name = "InvalidOracleType"
    msg = "The given oracle type is invalid"


class PriceOracleIssue(ProgramError):
    def __init__(self) -> None:
        super().__init__(
            6035, "Oracle encountered an issue when fetching accurate price."
        )

    code = 6035
    name = "PriceOracleIssue"
    msg = "Oracle encountered an issue when fetching accurate price."


class InvalidPythStatus(ProgramError):
    def __init__(self) -> None:
        super().__init__(6036, "Pyth oracle is not in trading status.")

    code = 6036
    name = "InvalidPythStatus"
    msg = "Pyth oracle is not in trading status."


class InvalidRemainingAccounts(ProgramError):
    def __init__(self) -> None:
        super().__init__(6037, "The remaining accounts passed are invalid")

    code = 6037
    name = "InvalidRemainingAccounts"
    msg = "The remaining accounts passed are invalid"


class DifferentExpo(ProgramError):
    def __init__(self) -> None:
        super().__init__(6038, "Expo is different")

    code = 6038
    name = "DifferentExpo"
    msg = "Expo is different"


class InsufficientInsurance(ProgramError):
    def __init__(self) -> None:
        super().__init__(6039, "Insufficient funds in insurance")

    code = 6039
    name = "InsufficientInsurance"
    msg = "Insufficient funds in insurance"


class InvalidOracle(ProgramError):
    def __init__(self) -> None:
        super().__init__(6040, "The oracle is invalid")

    code = 6040
    name = "InvalidOracle"
    msg = "The oracle is invalid"


class OracleNeedsUpdating(ProgramError):
    def __init__(self) -> None:
        super().__init__(
            6041, "Oracle last updated time is beyond the valid time since last update"
        )

    code = 6041
    name = "OracleNeedsUpdating"
    msg = "Oracle last updated time is beyond the valid time since last update"


class InvalidSymbol(ProgramError):
    def __init__(self) -> None:
        super().__init__(6042, "The symbol is invalid")

    code = 6042
    name = "InvalidSymbol"
    msg = "The symbol is invalid"


class NegativeCollateral(ProgramError):
    def __init__(self) -> None:
        super().__init__(6043, "Negative collateral value")

    code = 6043
    name = "NegativeCollateral"
    msg = "Negative collateral value"


class NothingToRepay(ProgramError):
    def __init__(self) -> None:
        super().__init__(6044, "There is nothing to repay, cannot use repay only")

    code = 6044
    name = "NothingToRepay"
    msg = "There is nothing to repay, cannot use repay only"


class NothingToWithdraw(ProgramError):
    def __init__(self) -> None:
        super().__init__(
            6045, "There is nothing to repay, cannot use without allow borrow"
        )

    code = 6045
    name = "NothingToWithdraw"
    msg = "There is nothing to repay, cannot use without allow borrow"


class InsufficientWithdrawalLiquidity(ProgramError):
    def __init__(self) -> None:
        super().__init__(6046, "There is not enough liquidity in the vault to withdraw")

    code = 6046
    name = "InsufficientWithdrawalLiquidity"
    msg = "There is not enough liquidity in the vault to withdraw"


class UncancelledOpenOrders(ProgramError):
    def __init__(self) -> None:
        super().__init__(6047, "There are open orders that have not been cancelled yet")

    code = 6047
    name = "UncancelledOpenOrders"
    msg = "There are open orders that have not been cancelled yet"


class InvalidOpenOrdersKey(ProgramError):
    def __init__(self) -> None:
        super().__init__(6048, "Invalid open orders key")

    code = 6048
    name = "InvalidOpenOrdersKey"
    msg = "Invalid open orders key"


class NotBorrowable(ProgramError):
    def __init__(self) -> None:
        super().__init__(6049, "The asset is not borrowable")

    code = 6049
    name = "NotBorrowable"
    msg = "The asset is not borrowable"


class InvalidOracleSymbol(ProgramError):
    def __init__(self) -> None:
        super().__init__(6050, "The oracle symbol is invalid")

    code = 6050
    name = "InvalidOracleSymbol"
    msg = "The oracle symbol is invalid"


class UnliquidatedActivePositions(ProgramError):
    def __init__(self) -> None:
        super().__init__(6051, "There are active positions that have not been closed")

    code = 6051
    name = "UnliquidatedActivePositions"
    msg = "There are active positions that have not been closed"


class UnliquidatedSpotPositions(ProgramError):
    def __init__(self) -> None:
        super().__init__(
            6052, "There are spot/ borrow positions that have not been liquidated"
        )

    code = 6052
    name = "UnliquidatedSpotPositions"
    msg = "There are spot/ borrow positions that have not been liquidated"


class InvalidTimestamp(ProgramError):
    def __init__(self) -> None:
        super().__init__(6053, "Timestamp is invalid")

    code = 6053
    name = "InvalidTimestamp"
    msg = "Timestamp is invalid"


class CollateralSwappable(ProgramError):
    def __init__(self) -> None:
        super().__init__(6054, "Collateral is already swappable")

    code = 6054
    name = "CollateralSwappable"
    msg = "Collateral is already swappable"


class CollateralNotSwappable(ProgramError):
    def __init__(self) -> None:
        super().__init__(6055, "Collateral is not swappable")

    code = 6055
    name = "CollateralNotSwappable"
    msg = "Collateral is not swappable"


class SwapNegative(ProgramError):
    def __init__(self) -> None:
        super().__init__(6056, "Swap did the opposite of what it should have")

    code = 6056
    name = "SwapNegative"
    msg = "Swap did the opposite of what it should have"


class SelfSwap(ProgramError):
    def __init__(self) -> None:
        super().__init__(6057, "Can't swap to and from the same collateral")

    code = 6057
    name = "SelfSwap"
    msg = "Can't swap to and from the same collateral"


class InsufficientSupply(ProgramError):
    def __init__(self) -> None:
        super().__init__(6058, "Insufficient supply")

    code = 6058
    name = "InsufficientSupply"
    msg = "Insufficient supply"


class OracleCacheStale(ProgramError):
    def __init__(self) -> None:
        super().__init__(6059, "Oracle has not been recently updated")

    code = 6059
    name = "OracleCacheStale"
    msg = "Oracle has not been recently updated"


class ZeroSwap(ProgramError):
    def __init__(self) -> None:
        super().__init__(6060, "No tokens received when swapping")

    code = 6060
    name = "ZeroSwap"
    msg = "No tokens received when swapping"


class SlippageExceeded(ProgramError):
    def __init__(self) -> None:
        super().__init__(6061, "Slippage tolerance exceeded")

    code = 6061
    name = "SlippageExceeded"
    msg = "Slippage tolerance exceeded"


class ReduceOnlyViolated(ProgramError):
    def __init__(self) -> None:
        super().__init__(6062, "Reduce only order was violated")

    code = 6062
    name = "ReduceOnlyViolated"
    msg = "Reduce only order was violated"


class Unimplemented(ProgramError):
    def __init__(self) -> None:
        super().__init__(6063, "Unimplemented")

    code = 6063
    name = "Unimplemented"
    msg = "Unimplemented"


class Bankrupt(ProgramError):
    def __init__(self) -> None:
        super().__init__(6064, "Currently bankrupt")

    code = 6064
    name = "Bankrupt"
    msg = "Currently bankrupt"


class AboveDepositLimit(ProgramError):
    def __init__(self) -> None:
        super().__init__(6065, "Deposit exceeds deposit limit for the collateral")

    code = 6065
    name = "AboveDepositLimit"
    msg = "Deposit exceeds deposit limit for the collateral"


class BelowDustThreshold(ProgramError):
    def __init__(self) -> None:
        super().__init__(6066, "Below the dust threshold")

    code = 6066
    name = "BelowDustThreshold"
    msg = "Below the dust threshold"


class InvalidLiquidation(ProgramError):
    def __init__(self) -> None:
        super().__init__(6067, "The liquidation is invalid")

    code = 6067
    name = "InvalidLiquidation"
    msg = "The liquidation is invalid"


class OutsidePriceBands(ProgramError):
    def __init__(self) -> None:
        super().__init__(6068, "The post orders are outside the price bands")

    code = 6068
    name = "OutsidePriceBands"
    msg = "The post orders are outside the price bands"


class MarkTooFarFromIndex(ProgramError):
    def __init__(self) -> None:
        super().__init__(6069, "The mark price is too far from the index price")

    code = 6069
    name = "MarkTooFarFromIndex"
    msg = "The mark price is too far from the index price"


class FillOrKillNotFilled(ProgramError):
    def __init__(self) -> None:
        super().__init__(6070, "FillOrKill order was not completely filled")

    code = 6070
    name = "FillOrKillNotFilled"
    msg = "FillOrKill order was not completely filled"


class ZammError(ProgramError):
    def __init__(self) -> None:
        super().__init__(6071, "An error occurred during a Zamm operation")

    code = 6071
    name = "ZammError"
    msg = "An error occurred during a Zamm operation"


class InvalidPerpType(ProgramError):
    def __init__(self) -> None:
        super().__init__(6072, "An invalid perp type was used")

    code = 6072
    name = "InvalidPerpType"
    msg = "An invalid perp type was used"


class DisabledMarket(ProgramError):
    def __init__(self) -> None:
        super().__init__(6073, "This market is disabled")

    code = 6073
    name = "DisabledMarket"
    msg = "This market is disabled"


class CollateralDisabled(ProgramError):
    def __init__(self) -> None:
        super().__init__(6074, "This collateral is disabled")

    code = 6074
    name = "CollateralDisabled"
    msg = "This collateral is disabled"


CustomError = typing.Union[
    MathFailure,
    InsufficientFunds,
    Unauthorized,
    InvalidArgument,
    InvalidMint,
    InvalidOrderState,
    BelowMarginMaintenance,
    AboveMMF,
    PositionValueCalculationFailure,
    InvalidPythAccount,
    IncompleteLiquidation,
    NotMarkedLiquidate,
    UnderLiquidation,
    LoadDexMarketFailure,
    LoadOpenOrdersFailure,
    CalculateMarginRatioFailure,
    BelowInitialMarginFraction,
    NoPositionToLiquidate,
    CollateralAlreadyExists,
    CollateralAtCapacity,
    CollateralDoesNotExist,
    DexMarketKeyAlreadyExists,
    SymbolAlreadyExists,
    MarketsAtCapacity,
    InvalidVault,
    InvalidDexMarketKey,
    OpenOrdersAlreadyInitialized,
    InvalidLimitPrice,
    InvalidMaxBaseQuantity,
    InvalidMaxQuoteQuantity,
    OracleAlreadyExists,
    OracleCacheFull,
    OracleDoesNotExist,
    InvalidOracleKey,
    InvalidOracleType,
    PriceOracleIssue,
    InvalidPythStatus,
    InvalidRemainingAccounts,
    DifferentExpo,
    InsufficientInsurance,
    InvalidOracle,
    OracleNeedsUpdating,
    InvalidSymbol,
    NegativeCollateral,
    NothingToRepay,
    NothingToWithdraw,
    InsufficientWithdrawalLiquidity,
    UncancelledOpenOrders,
    InvalidOpenOrdersKey,
    NotBorrowable,
    InvalidOracleSymbol,
    UnliquidatedActivePositions,
    UnliquidatedSpotPositions,
    InvalidTimestamp,
    CollateralSwappable,
    CollateralNotSwappable,
    SwapNegative,
    SelfSwap,
    InsufficientSupply,
    OracleCacheStale,
    ZeroSwap,
    SlippageExceeded,
    ReduceOnlyViolated,
    Unimplemented,
    Bankrupt,
    AboveDepositLimit,
    BelowDustThreshold,
    InvalidLiquidation,
    OutsidePriceBands,
    MarkTooFarFromIndex,
    FillOrKillNotFilled,
    ZammError,
    InvalidPerpType,
    DisabledMarket,
    CollateralDisabled,
]
CUSTOM_ERROR_MAP: dict[int, CustomError] = {
    6000: MathFailure(),
    6001: InsufficientFunds(),
    6002: Unauthorized(),
    6003: InvalidArgument(),
    6004: InvalidMint(),
    6005: InvalidOrderState(),
    6006: BelowMarginMaintenance(),
    6007: AboveMMF(),
    6008: PositionValueCalculationFailure(),
    6009: InvalidPythAccount(),
    6010: IncompleteLiquidation(),
    6011: NotMarkedLiquidate(),
    6012: UnderLiquidation(),
    6013: LoadDexMarketFailure(),
    6014: LoadOpenOrdersFailure(),
    6015: CalculateMarginRatioFailure(),
    6016: BelowInitialMarginFraction(),
    6017: NoPositionToLiquidate(),
    6018: CollateralAlreadyExists(),
    6019: CollateralAtCapacity(),
    6020: CollateralDoesNotExist(),
    6021: DexMarketKeyAlreadyExists(),
    6022: SymbolAlreadyExists(),
    6023: MarketsAtCapacity(),
    6024: InvalidVault(),
    6025: InvalidDexMarketKey(),
    6026: OpenOrdersAlreadyInitialized(),
    6027: InvalidLimitPrice(),
    6028: InvalidMaxBaseQuantity(),
    6029: InvalidMaxQuoteQuantity(),
    6030: OracleAlreadyExists(),
    6031: OracleCacheFull(),
    6032: OracleDoesNotExist(),
    6033: InvalidOracleKey(),
    6034: InvalidOracleType(),
    6035: PriceOracleIssue(),
    6036: InvalidPythStatus(),
    6037: InvalidRemainingAccounts(),
    6038: DifferentExpo(),
    6039: InsufficientInsurance(),
    6040: InvalidOracle(),
    6041: OracleNeedsUpdating(),
    6042: InvalidSymbol(),
    6043: NegativeCollateral(),
    6044: NothingToRepay(),
    6045: NothingToWithdraw(),
    6046: InsufficientWithdrawalLiquidity(),
    6047: UncancelledOpenOrders(),
    6048: InvalidOpenOrdersKey(),
    6049: NotBorrowable(),
    6050: InvalidOracleSymbol(),
    6051: UnliquidatedActivePositions(),
    6052: UnliquidatedSpotPositions(),
    6053: InvalidTimestamp(),
    6054: CollateralSwappable(),
    6055: CollateralNotSwappable(),
    6056: SwapNegative(),
    6057: SelfSwap(),
    6058: InsufficientSupply(),
    6059: OracleCacheStale(),
    6060: ZeroSwap(),
    6061: SlippageExceeded(),
    6062: ReduceOnlyViolated(),
    6063: Unimplemented(),
    6064: Bankrupt(),
    6065: AboveDepositLimit(),
    6066: BelowDustThreshold(),
    6067: InvalidLiquidation(),
    6068: OutsidePriceBands(),
    6069: MarkTooFarFromIndex(),
    6070: FillOrKillNotFilled(),
    6071: ZammError(),
    6072: InvalidPerpType(),
    6073: DisabledMarket(),
    6074: CollateralDisabled(),
}


def from_code(code: int) -> typing.Optional[CustomError]:
    maybe_err = CUSTOM_ERROR_MAP.get(code)
    if maybe_err is None:
        return None
    return maybe_err
