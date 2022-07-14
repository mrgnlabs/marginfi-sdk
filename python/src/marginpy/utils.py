import base64
import json
import os
import enum
from dataclasses import dataclass
from typing import Dict, Any

from anchorpy import Idl
from solana.rpc.responses import AccountInfo

from marginpy.constants import COLLATERAL_DECIMALS
from marginpy.generated_client.types import UTPAccountConfig


def load_idl() -> Idl:
    idl_path = os.path.join(os.path.dirname(__file__), "idl.json")
    with open(idl_path) as f:
        raw_idl = json.load(f)
    idl = Idl.from_json(raw_idl)
    return idl


class UtpIndex(enum.Enum):
    Mango = 0
    Zo = 1

    def __index__(self):
        return self.value


@dataclass
class UtpData:
    is_active: bool
    account_config: UTPAccountConfig


def b64str_to_bytes(data_str: str) -> bytes:
    return base64.decodebytes(data_str.encode("ascii"))


def json_to_account_info(account_info_raw: Dict[str, Any]) -> AccountInfo:
    return AccountInfo(lamports=account_info_raw['lamports'],
                       owner=account_info_raw['owner'],
                       rent_epoch=account_info_raw['rentEpoch'],
                       data=account_info_raw['data'],
                       executable=account_info_raw['executable'])


def ui_to_native(amount: float, decimals: int = COLLATERAL_DECIMALS) -> int:
    return int(amount * 10 ** decimals)
