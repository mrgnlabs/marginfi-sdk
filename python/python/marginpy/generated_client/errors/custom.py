import typing

from anchorpy.error import ProgramError


class EmptyLendingPool(ProgramError):
    def __init__(self) -> None:
        super().__init__(6000, "Lending pool empty")

    code = 6000
    name = "EmptyLendingPool"
    msg = "Lending pool empty"


class IllegalUtilizationRatio(ProgramError):
    def __init__(self) -> None:
        super().__init__(6001, "Illegal utilization ratio")

    code = 6001
    name = "IllegalUtilizationRatio"
    msg = "Illegal utilization ratio"


class MathError(ProgramError):
    def __init__(self) -> None:
        super().__init__(6002, "very bad mafs")

    code = 6002
    name = "MathError"
    msg = "very bad mafs"


class InvalidTimestamp(ProgramError):
    def __init__(self) -> None:
        super().__init__(6003, "Invalid timestamp")

    code = 6003
    name = "InvalidTimestamp"
    msg = "Invalid timestamp"


class MarginRequirementsNotMet(ProgramError):
    def __init__(self) -> None:
        super().__init__(6004, "Initialization margin requirements not met")

    code = 6004
    name = "MarginRequirementsNotMet"
    msg = "Initialization margin requirements not met"


class OnlyReduceAllowed(ProgramError):
    def __init__(self) -> None:
        super().__init__(
            6005, "Only reducing trades are allowed when under init margin requirements"
        )

    code = 6005
    name = "OnlyReduceAllowed"
    msg = "Only reducing trades are allowed when under init margin requirements"


class UtpInactive(ProgramError):
    def __init__(self) -> None:
        super().__init__(6006, "Inactive UTP")

    code = 6006
    name = "UtpInactive"
    msg = "Inactive UTP"


class UtpAlreadyActive(ProgramError):
    def __init__(self) -> None:
        super().__init__(6007, "Utp is already active")

    code = 6007
    name = "UtpAlreadyActive"
    msg = "Utp is already active"


class InvalidAccountData(ProgramError):
    def __init__(self) -> None:
        super().__init__(6008, "Invalid Account Data")

    code = 6008
    name = "InvalidAccountData"
    msg = "Invalid Account Data"


class LiquidatorHasActiveUtps(ProgramError):
    def __init__(self) -> None:
        super().__init__(6009, "Liquidator has active utps")

    code = 6009
    name = "LiquidatorHasActiveUtps"
    msg = "Liquidator has active utps"


class AccountHasActiveUtps(ProgramError):
    def __init__(self) -> None:
        super().__init__(6010, "Account has active utps")

    code = 6010
    name = "AccountHasActiveUtps"
    msg = "Account has active utps"


class AccountNotLiquidatable(ProgramError):
    def __init__(self) -> None:
        super().__init__(6011, "Marginfi account not liquidatable")

    code = 6011
    name = "AccountNotLiquidatable"
    msg = "Marginfi account not liquidatable"


class AccountNotBankrupt(ProgramError):
    def __init__(self) -> None:
        super().__init__(6012, "Marginfi account not bankrupt")

    code = 6012
    name = "AccountNotBankrupt"
    msg = "Marginfi account not bankrupt"


class IllegalUtpDeactivation(ProgramError):
    def __init__(self) -> None:
        super().__init__(6013, "Utp account cannot be deactivated")

    code = 6013
    name = "IllegalUtpDeactivation"
    msg = "Utp account cannot be deactivated"


class IllegalRebalance(ProgramError):
    def __init__(self) -> None:
        super().__init__(6014, "Rebalance not legal")

    code = 6014
    name = "IllegalRebalance"
    msg = "Rebalance not legal"


class BorrowNotAllowed(ProgramError):
    def __init__(self) -> None:
        super().__init__(6015, "Borrow not allowed")

    code = 6015
    name = "BorrowNotAllowed"
    msg = "Borrow not allowed"


class IllegalConfig(ProgramError):
    def __init__(self) -> None:
        super().__init__(6016, "Config value not legal")

    code = 6016
    name = "IllegalConfig"
    msg = "Config value not legal"


class OperationsPaused(ProgramError):
    def __init__(self) -> None:
        super().__init__(6017, "Operations paused")

    code = 6017
    name = "OperationsPaused"
    msg = "Operations paused"


class InsufficientVaultBalance(ProgramError):
    def __init__(self) -> None:
        super().__init__(6018, "Insufficient balance")

    code = 6018
    name = "InsufficientVaultBalance"
    msg = "Insufficient balance"


class Forbidden(ProgramError):
    def __init__(self) -> None:
        super().__init__(6019, "This operation is forbidden")

    code = 6019
    name = "Forbidden"
    msg = "This operation is forbidden"


class InvalidUTPAccount(ProgramError):
    def __init__(self) -> None:
        super().__init__(6020, "Invalid account key")

    code = 6020
    name = "InvalidUTPAccount"
    msg = "Invalid account key"


class AccountDepositLimit(ProgramError):
    def __init__(self) -> None:
        super().__init__(6021, "Deposit exceeds account cap")

    code = 6021
    name = "AccountDepositLimit"
    msg = "Deposit exceeds account cap"


class GroupDepositLimit(ProgramError):
    def __init__(self) -> None:
        super().__init__(6022, "Deposit exceeds group cap")

    code = 6022
    name = "GroupDepositLimit"
    msg = "Deposit exceeds group cap"


class InvalidObserveAccounts(ProgramError):
    def __init__(self) -> None:
        super().__init__(6023, "Missing accounts for UTP observation")

    code = 6023
    name = "InvalidObserveAccounts"
    msg = "Missing accounts for UTP observation"


class MangoError(ProgramError):
    def __init__(self) -> None:
        super().__init__(6024, "Mango error")

    code = 6024
    name = "MangoError"
    msg = "Mango error"


CustomError = typing.Union[
    EmptyLendingPool,
    IllegalUtilizationRatio,
    MathError,
    InvalidTimestamp,
    MarginRequirementsNotMet,
    OnlyReduceAllowed,
    UtpInactive,
    UtpAlreadyActive,
    InvalidAccountData,
    LiquidatorHasActiveUtps,
    AccountHasActiveUtps,
    AccountNotLiquidatable,
    AccountNotBankrupt,
    IllegalUtpDeactivation,
    IllegalRebalance,
    BorrowNotAllowed,
    IllegalConfig,
    OperationsPaused,
    InsufficientVaultBalance,
    Forbidden,
    InvalidUTPAccount,
    AccountDepositLimit,
    GroupDepositLimit,
    InvalidObserveAccounts,
    MangoError,
]
CUSTOM_ERROR_MAP: dict[int, CustomError] = {
    6000: EmptyLendingPool(),
    6001: IllegalUtilizationRatio(),
    6002: MathError(),
    6003: InvalidTimestamp(),
    6004: MarginRequirementsNotMet(),
    6005: OnlyReduceAllowed(),
    6006: UtpInactive(),
    6007: UtpAlreadyActive(),
    6008: InvalidAccountData(),
    6009: LiquidatorHasActiveUtps(),
    6010: AccountHasActiveUtps(),
    6011: AccountNotLiquidatable(),
    6012: AccountNotBankrupt(),
    6013: IllegalUtpDeactivation(),
    6014: IllegalRebalance(),
    6015: BorrowNotAllowed(),
    6016: IllegalConfig(),
    6017: OperationsPaused(),
    6018: InsufficientVaultBalance(),
    6019: Forbidden(),
    6020: InvalidUTPAccount(),
    6021: AccountDepositLimit(),
    6022: GroupDepositLimit(),
    6023: InvalidObserveAccounts(),
    6024: MangoError(),
}


def from_code(code: int) -> typing.Optional[CustomError]:
    maybe_err = CUSTOM_ERROR_MAP.get(code)
    if maybe_err is None:
        return None
    return maybe_err
