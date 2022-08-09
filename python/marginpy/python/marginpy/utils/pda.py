from typing import Tuple

from marginpy.constants import (
    PDA_BANK_FEE_VAULT_SEED,
    PDA_BANK_INSURANCE_VAULT_SEED,
    PDA_BANK_VAULT_SEED,
    PDA_UTP_AUTH_SEED,
    VERY_VERBOSE_ERROR,
)
from marginpy.types import BankVaultType
from solana.publickey import PublicKey


def get_vault_seeds(vault_type: BankVaultType) -> bytes:
    if vault_type == BankVaultType.LIQUIDITY_VAULT:
        return PDA_BANK_VAULT_SEED

    if vault_type == BankVaultType.INSURANCE_VAULT:
        return PDA_BANK_INSURANCE_VAULT_SEED

    if vault_type == BankVaultType.FEE_VAULT:
        return PDA_BANK_FEE_VAULT_SEED

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
