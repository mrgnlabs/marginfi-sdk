import typing

from anchorpy.error import ProgramError


class Unauthorized(ProgramError):
    def __init__(self) -> None:
        super().__init__(6000, "Signer not authorized to perform this action")

    code = 6000
    name = "Unauthorized"
    msg = "Signer not authorized to perform this action"


class EmptyLendingPool(ProgramError):
    def __init__(self) -> None:
        super().__init__(6001, "Lending pool empty")

    code = 6001
    name = "EmptyLendingPool"
    msg = "Lending pool empty"


class IllegalUtilizationRatio(ProgramError):
    def __init__(self) -> None:
        super().__init__(6002, "Illegal utilization ratio")

    code = 6002
    name = "IllegalUtilizationRatio"
    msg = "Illegal utilization ratio"


class MathError(ProgramError):
    def __init__(self) -> None:
        super().__init__(6003, "very bad mafs")

    code = 6003
    name = "MathError"
    msg = "very bad mafs"


class InvalidTimestamp(ProgramError):
    def __init__(self) -> None:
        super().__init__(6004, "Invalid timestamp")

    code = 6004
    name = "InvalidTimestamp"
    msg = "Invalid timestamp"


class MarginRequirementsNotMet(ProgramError):
    def __init__(self) -> None:
        super().__init__(6005, "Initialization margin requirements not met")

    code = 6005
    name = "MarginRequirementsNotMet"
    msg = "Initialization margin requirements not met"


class OnlyReduceAllowed(ProgramError):
    def __init__(self) -> None:
        super().__init__(
            6006, "Only reducing trades are allowed when under init margin requirements"
        )

    code = 6006
    name = "OnlyReduceAllowed"
    msg = "Only reducing trades are allowed when under init margin requirements"


class UtpInactive(ProgramError):
    def __init__(self) -> None:
        super().__init__(6007, "Inactive UTP")

    code = 6007
    name = "UtpInactive"
    msg = "Inactive UTP"


class UtpAlreadyActive(ProgramError):
    def __init__(self) -> None:
        super().__init__(6008, "Utp is already active")

    code = 6008
    name = "UtpAlreadyActive"
    msg = "Utp is already active"


class InvalidAccountData(ProgramError):
    def __init__(self) -> None:
        super().__init__(6009, "Invalid Account Data")

    code = 6009
    name = "InvalidAccountData"
    msg = "Invalid Account Data"


class LiquidatorHasActiveUtps(ProgramError):
    def __init__(self) -> None:
        super().__init__(6010, "Liquidator has active utps")

    code = 6010
    name = "LiquidatorHasActiveUtps"
    msg = "Liquidator has active utps"


class AccountHasActiveUtps(ProgramError):
    def __init__(self) -> None:
        super().__init__(6011, "Account has active utps")

    code = 6011
    name = "AccountHasActiveUtps"
    msg = "Account has active utps"


class AccountNotLiquidatable(ProgramError):
    def __init__(self) -> None:
        super().__init__(6012, "Marginfi account not liquidatable")

    code = 6012
    name = "AccountNotLiquidatable"
    msg = "Marginfi account not liquidatable"


class AccountNotBankrupt(ProgramError):
    def __init__(self) -> None:
        super().__init__(6013, "Marginfi account not bankrupt")

    code = 6013
    name = "AccountNotBankrupt"
    msg = "Marginfi account not bankrupt"


class IllegalUtpDeactivation(ProgramError):
    def __init__(self) -> None:
        super().__init__(6014, "Utp account cannot be deactivated")

    code = 6014
    name = "IllegalUtpDeactivation"
    msg = "Utp account cannot be deactivated"


class IllegalRebalance(ProgramError):
    def __init__(self) -> None:
        super().__init__(6015, "Rebalance not legal")

    code = 6015
    name = "IllegalRebalance"
    msg = "Rebalance not legal"


class BorrowNotAllowed(ProgramError):
    def __init__(self) -> None:
        super().__init__(6016, "Borrow not allowed")

    code = 6016
    name = "BorrowNotAllowed"
    msg = "Borrow not allowed"


class IllegalConfig(ProgramError):
    def __init__(self) -> None:
        super().__init__(6017, "Config value not legal")

    code = 6017
    name = "IllegalConfig"
    msg = "Config value not legal"


class OperationsPaused(ProgramError):
    def __init__(self) -> None:
        super().__init__(6018, "Operations paused")

    code = 6018
    name = "OperationsPaused"
    msg = "Operations paused"


class InsufficientVaultBalance(ProgramError):
    def __init__(self) -> None:
        super().__init__(6019, "Insufficient balance")

    code = 6019
    name = "InsufficientVaultBalance"
    msg = "Insufficient balance"


class Forbidden(ProgramError):
    def __init__(self) -> None:
        super().__init__(6020, "This operation is forbidden")

    code = 6020
    name = "Forbidden"
    msg = "This operation is forbidden"


class InvalidUTPAccount(ProgramError):
    def __init__(self) -> None:
        super().__init__(6021, "Invalid account key")

    code = 6021
    name = "InvalidUTPAccount"
    msg = "Invalid account key"


class AccountDepositLimit(ProgramError):
    def __init__(self) -> None:
        super().__init__(6022, "Deposit exceeds account cap")

    code = 6022
    name = "AccountDepositLimit"
    msg = "Deposit exceeds account cap"


class GroupDepositLimit(ProgramError):
    def __init__(self) -> None:
        super().__init__(6023, "Deposit exceeds group cap")

    code = 6023
    name = "GroupDepositLimit"
    msg = "Deposit exceeds group cap"


class InvalidObserveAccounts(ProgramError):
    def __init__(self) -> None:
        super().__init__(6024, "Missing accounts for UTP observation")

    code = 6024
    name = "InvalidObserveAccounts"
    msg = "Missing accounts for UTP observation"


class MangoError(ProgramError):
    def __init__(self) -> None:
        super().__init__(6025, "Mango error")

    code = 6025
    name = "MangoError"
    msg = "Mango error"


CustomError = typing.Union[
    Unauthorized,
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
    6000: Unauthorized(),
    6001: EmptyLendingPool(),
    6002: IllegalUtilizationRatio(),
    6003: MathError(),
    6004: InvalidTimestamp(),
    6005: MarginRequirementsNotMet(),
    6006: OnlyReduceAllowed(),
    6007: UtpInactive(),
    6008: UtpAlreadyActive(),
    6009: InvalidAccountData(),
    6010: LiquidatorHasActiveUtps(),
    6011: AccountHasActiveUtps(),
    6012: AccountNotLiquidatable(),
    6013: AccountNotBankrupt(),
    6014: IllegalUtpDeactivation(),
    6015: IllegalRebalance(),
    6016: BorrowNotAllowed(),
    6017: IllegalConfig(),
    6018: OperationsPaused(),
    6019: InsufficientVaultBalance(),
    6020: Forbidden(),
    6021: InvalidUTPAccount(),
    6022: AccountDepositLimit(),
    6023: GroupDepositLimit(),
    6024: InvalidObserveAccounts(),
    6025: MangoError(),
}


def from_code(code: int) -> typing.Optional[CustomError]:
    maybe_err = CUSTOM_ERROR_MAP.get(code)
    if maybe_err is None:
        return None
    return maybe_err
