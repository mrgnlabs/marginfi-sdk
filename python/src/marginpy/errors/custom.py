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


class UtpInactive(ProgramError):
    def __init__(self) -> None:
        super().__init__(6005, "Inactive UTP")

    code = 6005
    name = "UtpInactive"
    msg = "Inactive UTP"


class UtpAlreadyActive(ProgramError):
    def __init__(self) -> None:
        super().__init__(6006, "Utp is already active")

    code = 6006
    name = "UtpAlreadyActive"
    msg = "Utp is already active"


class InvalidAccountData(ProgramError):
    def __init__(self) -> None:
        super().__init__(6007, "Invalid Account Data")

    code = 6007
    name = "InvalidAccountData"
    msg = "Invalid Account Data"


class LiquidatorHasActiveUtps(ProgramError):
    def __init__(self) -> None:
        super().__init__(6008, "Liquidator has active utps")

    code = 6008
    name = "LiquidatorHasActiveUtps"
    msg = "Liquidator has active utps"


class AccountHasActiveUtps(ProgramError):
    def __init__(self) -> None:
        super().__init__(6009, "Account has active utps")

    code = 6009
    name = "AccountHasActiveUtps"
    msg = "Account has active utps"


class AccountNotLiquidatable(ProgramError):
    def __init__(self) -> None:
        super().__init__(6010, "Marginfi account not liquidatable")

    code = 6010
    name = "AccountNotLiquidatable"
    msg = "Marginfi account not liquidatable"


class AccountNotBankrupt(ProgramError):
    def __init__(self) -> None:
        super().__init__(6011, "Marginfi account not bankrupt")

    code = 6011
    name = "AccountNotBankrupt"
    msg = "Marginfi account not bankrupt"


class IllegalUtpDeactivation(ProgramError):
    def __init__(self) -> None:
        super().__init__(6012, "Utp account cannot be deactivated")

    code = 6012
    name = "IllegalUtpDeactivation"
    msg = "Utp account cannot be deactivated"


class IllegalRebalance(ProgramError):
    def __init__(self) -> None:
        super().__init__(6013, "Rebalance not legal")

    code = 6013
    name = "IllegalRebalance"
    msg = "Rebalance not legal"


class BorrowNotAllowed(ProgramError):
    def __init__(self) -> None:
        super().__init__(6014, "Borrow not allowed")

    code = 6014
    name = "BorrowNotAllowed"
    msg = "Borrow not allowed"


class IllegalConfig(ProgramError):
    def __init__(self) -> None:
        super().__init__(6015, "Config value not legal")

    code = 6015
    name = "IllegalConfig"
    msg = "Config value not legal"


class OperationsPaused(ProgramError):
    def __init__(self) -> None:
        super().__init__(6016, "Operations paused")

    code = 6016
    name = "OperationsPaused"
    msg = "Operations paused"


class InsufficientVaultBalance(ProgramError):
    def __init__(self) -> None:
        super().__init__(6017, "Insufficient balance")

    code = 6017
    name = "InsufficientVaultBalance"
    msg = "Insufficient balance"


class Forbidden(ProgramError):
    def __init__(self) -> None:
        super().__init__(6018, "This operation is forbidden")

    code = 6018
    name = "Forbidden"
    msg = "This operation is forbidden"


class InvalidUTPAccount(ProgramError):
    def __init__(self) -> None:
        super().__init__(6019, "Invalid account key")

    code = 6019
    name = "InvalidUTPAccount"
    msg = "Invalid account key"


class AccountDepositLimit(ProgramError):
    def __init__(self) -> None:
        super().__init__(6020, "Deposit exceeds account cap")

    code = 6020
    name = "AccountDepositLimit"
    msg = "Deposit exceeds account cap"


class GroupDepositLimit(ProgramError):
    def __init__(self) -> None:
        super().__init__(6021, "Deposit exceeds group cap")

    code = 6021
    name = "GroupDepositLimit"
    msg = "Deposit exceeds group cap"


class InvalidObserveAccounts(ProgramError):
    def __init__(self) -> None:
        super().__init__(6022, "Missing accounts for UTP observation")

    code = 6022
    name = "InvalidObserveAccounts"
    msg = "Missing accounts for UTP observation"


class MangoError(ProgramError):
    def __init__(self) -> None:
        super().__init__(6023, "Mango error")

    code = 6023
    name = "MangoError"
    msg = "Mango error"


CustomError = typing.Union[
    EmptyLendingPool,
    IllegalUtilizationRatio,
    MathError,
    InvalidTimestamp,
    MarginRequirementsNotMet,
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
    6005: UtpInactive(),
    6006: UtpAlreadyActive(),
    6007: InvalidAccountData(),
    6008: LiquidatorHasActiveUtps(),
    6009: AccountHasActiveUtps(),
    6010: AccountNotLiquidatable(),
    6011: AccountNotBankrupt(),
    6012: IllegalUtpDeactivation(),
    6013: IllegalRebalance(),
    6014: BorrowNotAllowed(),
    6015: IllegalConfig(),
    6016: OperationsPaused(),
    6017: InsufficientVaultBalance(),
    6018: Forbidden(),
    6019: InvalidUTPAccount(),
    6020: AccountDepositLimit(),
    6021: GroupDepositLimit(),
    6022: InvalidObserveAccounts(),
    6023: MangoError(),
}


def from_code(code: int) -> typing.Optional[CustomError]:
    maybe_err = CUSTOM_ERROR_MAP.get(code)
    if maybe_err is None:
        return None
    return maybe_err
