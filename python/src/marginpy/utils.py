import base64
import json
import os
from typing import Any, Dict, Optional, Tuple

from anchorpy import Idl
from solana.publickey import PublicKey
from solana.rpc.responses import AccountInfo
from solana.transaction import TransactionInstruction

from marginpy.constants import (
    COLLATERAL_DECIMALS,
    PDA_BANK_FEE_VAULT_SEED,
    PDA_BANK_INSURANCE_VAULT_SEED,
    PDA_BANK_VAULT_SEED,
    PDA_UTP_AUTH_SEED,
    VERY_VERBOSE_ERROR,
)
from marginpy.types import BankVaultType


def load_idl(idl_path: Optional[str] = None) -> Idl:
    if idl_path is None:
        idl_path = os.path.join(os.path.dirname(__file__), "idl.json")
    with open(idl_path) as f:
        raw_idl = json.load(f)
    idl = Idl.from_json(raw_idl)
    return idl


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


def get_vault_seeds(vault_type: BankVaultType) -> bytes:
    if vault_type == BankVaultType.LIQUIDITY_VAULT:
        return PDA_BANK_VAULT_SEED
    elif vault_type == BankVaultType.INSURANCE_VAULT:
        return PDA_BANK_INSURANCE_VAULT_SEED
    elif vault_type == BankVaultType.FEE_VAULT:
        return PDA_BANK_FEE_VAULT_SEED
    else:
        raise Exception(VERY_VERBOSE_ERROR)


def get_utp_authority(
    utp_program_id: PublicKey, authority_seed: PublicKey, program_id: PublicKey
) -> Tuple[PublicKey, int]:
    return PublicKey.find_program_address(
        [PDA_UTP_AUTH_SEED, bytes(utp_program_id), bytes(authority_seed)], program_id
    )


def get_bank_authority(
    marginfi_group_pk: PublicKey,
    program_id: PublicKey,
    bank_vault_type: BankVaultType = BankVaultType.LIQUIDITY_VAULT,
) -> Tuple[PublicKey, int]:
    return PublicKey.find_program_address(
        [get_vault_seeds(bank_vault_type), bytes(marginfi_group_pk)], program_id
    )


def handle_override(override_key: str, default: Any, overrides: Dict[str, Any] = {}):
    if overrides is None:
        return default
    return overrides[override_key] if override_key in overrides.keys() else default


def make_request_units_ix(
    units: int,
    additionalFee: int,
) -> TransactionInstruction:
    data = b"\x00" + units.to_bytes(4, "little") + additionalFee.to_bytes(4, "little")
    return TransactionInstruction(
        [], PublicKey("ComputeBudget111111111111111111111111111111"), data
    )
