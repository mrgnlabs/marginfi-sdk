import base64
from typing import Any, Dict

from marginpy.constants import COLLATERAL_DECIMALS
from marginpy.generated_client.types.wrapped_i80f48 import WrappedI80F48
from solana.rpc.responses import AccountInfo


def b64str_to_bytes(data_str: str) -> bytes:
    return base64.decodebytes(data_str.encode("ascii"))


def json_to_account_info(account_info_raw: Dict[str, Any]) -> AccountInfo:
    return AccountInfo(
        lamports=account_info_raw["lamports"],
        owner=account_info_raw["owner"],
        rent_epoch=account_info_raw["rentEpoch"],
        data=account_info_raw["data"],
        executable=account_info_raw["executable"],
    )


def ui_to_native(amount: float, decimals: int = COLLATERAL_DECIMALS) -> int:
    return int(amount * 10**decimals)


# TODO: revisit when number libs have been explored
def wrapped_fixed_to_float(raw: WrappedI80F48) -> float:
    fixed_point_in_bits = 8 * 6
    divisor = 2**fixed_point_in_bits
    return round(raw.bits / divisor, 6)
