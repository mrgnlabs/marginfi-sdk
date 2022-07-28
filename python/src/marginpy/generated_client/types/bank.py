from __future__ import annotations

import typing
from dataclasses import dataclass

import borsh_construct as borsh
from anchorpy.borsh_extension import BorshPubkey
from construct import Container
from solana.publickey import PublicKey

from . import m_decimal


class BankJSON(typing.TypedDict):
    scaling_factor_c: m_decimal.MDecimalJSON
    fixed_fee: m_decimal.MDecimalJSON
    interest_fee: m_decimal.MDecimalJSON
    deposit_accumulator: m_decimal.MDecimalJSON
    borrow_accumulator: m_decimal.MDecimalJSON
    last_update: int
    native_deposit_balance: m_decimal.MDecimalJSON
    native_borrow_balance: m_decimal.MDecimalJSON
    mint: str
    vault: str
    vault_authority_pda_bump: int
    insurance_vault: str
    insurance_vault_authority_pda_bump: int
    insurance_vault_outstanding_transfers: m_decimal.MDecimalJSON
    fee_vault: str
    fee_vault_authority_pda_bump: int
    fee_vault_outstanding_transfers: m_decimal.MDecimalJSON
    init_margin_ratio: m_decimal.MDecimalJSON
    maint_margin_ratio: m_decimal.MDecimalJSON
    account_deposit_limit: m_decimal.MDecimalJSON
    lp_deposit_limit: m_decimal.MDecimalJSON
    reserved_space: list[int]


@dataclass
class Bank:
    layout: typing.ClassVar = borsh.CStruct(
        "scaling_factor_c" / m_decimal.MDecimal.layout,
        "fixed_fee" / m_decimal.MDecimal.layout,
        "interest_fee" / m_decimal.MDecimal.layout,
        "deposit_accumulator" / m_decimal.MDecimal.layout,
        "borrow_accumulator" / m_decimal.MDecimal.layout,
        "last_update" / borsh.I64,
        "native_deposit_balance" / m_decimal.MDecimal.layout,
        "native_borrow_balance" / m_decimal.MDecimal.layout,
        "mint" / BorshPubkey,
        "vault" / BorshPubkey,
        "vault_authority_pda_bump" / borsh.U8,
        "insurance_vault" / BorshPubkey,
        "insurance_vault_authority_pda_bump" / borsh.U8,
        "insurance_vault_outstanding_transfers" / m_decimal.MDecimal.layout,
        "fee_vault" / BorshPubkey,
        "fee_vault_authority_pda_bump" / borsh.U8,
        "fee_vault_outstanding_transfers" / m_decimal.MDecimal.layout,
        "init_margin_ratio" / m_decimal.MDecimal.layout,
        "maint_margin_ratio" / m_decimal.MDecimal.layout,
        "account_deposit_limit" / m_decimal.MDecimal.layout,
        "lp_deposit_limit" / m_decimal.MDecimal.layout,
        "reserved_space" / borsh.U128[31],
    )
    scaling_factor_c: m_decimal.MDecimal
    fixed_fee: m_decimal.MDecimal
    interest_fee: m_decimal.MDecimal
    deposit_accumulator: m_decimal.MDecimal
    borrow_accumulator: m_decimal.MDecimal
    last_update: int
    native_deposit_balance: m_decimal.MDecimal
    native_borrow_balance: m_decimal.MDecimal
    mint: PublicKey
    vault: PublicKey
    vault_authority_pda_bump: int
    insurance_vault: PublicKey
    insurance_vault_authority_pda_bump: int
    insurance_vault_outstanding_transfers: m_decimal.MDecimal
    fee_vault: PublicKey
    fee_vault_authority_pda_bump: int
    fee_vault_outstanding_transfers: m_decimal.MDecimal
    init_margin_ratio: m_decimal.MDecimal
    maint_margin_ratio: m_decimal.MDecimal
    account_deposit_limit: m_decimal.MDecimal
    lp_deposit_limit: m_decimal.MDecimal
    reserved_space: list[int]

    @classmethod
    def from_decoded(cls, obj: Container) -> "Bank":
        return cls(
            scaling_factor_c=m_decimal.MDecimal.from_decoded(obj.scaling_factor_c),
            fixed_fee=m_decimal.MDecimal.from_decoded(obj.fixed_fee),
            interest_fee=m_decimal.MDecimal.from_decoded(obj.interest_fee),
            deposit_accumulator=m_decimal.MDecimal.from_decoded(
                obj.deposit_accumulator
            ),
            borrow_accumulator=m_decimal.MDecimal.from_decoded(obj.borrow_accumulator),
            last_update=obj.last_update,
            native_deposit_balance=m_decimal.MDecimal.from_decoded(
                obj.native_deposit_balance
            ),
            native_borrow_balance=m_decimal.MDecimal.from_decoded(
                obj.native_borrow_balance
            ),
            mint=obj.mint,
            vault=obj.vault,
            vault_authority_pda_bump=obj.vault_authority_pda_bump,
            insurance_vault=obj.insurance_vault,
            insurance_vault_authority_pda_bump=obj.insurance_vault_authority_pda_bump,
            insurance_vault_outstanding_transfers=m_decimal.MDecimal.from_decoded(
                obj.insurance_vault_outstanding_transfers
            ),
            fee_vault=obj.fee_vault,
            fee_vault_authority_pda_bump=obj.fee_vault_authority_pda_bump,
            fee_vault_outstanding_transfers=m_decimal.MDecimal.from_decoded(
                obj.fee_vault_outstanding_transfers
            ),
            init_margin_ratio=m_decimal.MDecimal.from_decoded(obj.init_margin_ratio),
            maint_margin_ratio=m_decimal.MDecimal.from_decoded(obj.maint_margin_ratio),
            account_deposit_limit=m_decimal.MDecimal.from_decoded(
                obj.account_deposit_limit
            ),
            lp_deposit_limit=m_decimal.MDecimal.from_decoded(obj.lp_deposit_limit),
            reserved_space=obj.reserved_space,
        )

    def to_encodable(self) -> dict[str, typing.Any]:
        return {
            "scaling_factor_c": self.scaling_factor_c.to_encodable(),
            "fixed_fee": self.fixed_fee.to_encodable(),
            "interest_fee": self.interest_fee.to_encodable(),
            "deposit_accumulator": self.deposit_accumulator.to_encodable(),
            "borrow_accumulator": self.borrow_accumulator.to_encodable(),
            "last_update": self.last_update,
            "native_deposit_balance": self.native_deposit_balance.to_encodable(),
            "native_borrow_balance": self.native_borrow_balance.to_encodable(),
            "mint": self.mint,
            "vault": self.vault,
            "vault_authority_pda_bump": self.vault_authority_pda_bump,
            "insurance_vault": self.insurance_vault,
            "insurance_vault_authority_pda_bump": self.insurance_vault_authority_pda_bump,
            "insurance_vault_outstanding_transfers": self.insurance_vault_outstanding_transfers.to_encodable(),
            "fee_vault": self.fee_vault,
            "fee_vault_authority_pda_bump": self.fee_vault_authority_pda_bump,
            "fee_vault_outstanding_transfers": self.fee_vault_outstanding_transfers.to_encodable(),
            "init_margin_ratio": self.init_margin_ratio.to_encodable(),
            "maint_margin_ratio": self.maint_margin_ratio.to_encodable(),
            "account_deposit_limit": self.account_deposit_limit.to_encodable(),
            "lp_deposit_limit": self.lp_deposit_limit.to_encodable(),
            "reserved_space": self.reserved_space,
        }

    def to_json(self) -> BankJSON:
        return {
            "scaling_factor_c": self.scaling_factor_c.to_json(),
            "fixed_fee": self.fixed_fee.to_json(),
            "interest_fee": self.interest_fee.to_json(),
            "deposit_accumulator": self.deposit_accumulator.to_json(),
            "borrow_accumulator": self.borrow_accumulator.to_json(),
            "last_update": self.last_update,
            "native_deposit_balance": self.native_deposit_balance.to_json(),
            "native_borrow_balance": self.native_borrow_balance.to_json(),
            "mint": str(self.mint),
            "vault": str(self.vault),
            "vault_authority_pda_bump": self.vault_authority_pda_bump,
            "insurance_vault": str(self.insurance_vault),
            "insurance_vault_authority_pda_bump": self.insurance_vault_authority_pda_bump,
            "insurance_vault_outstanding_transfers": self.insurance_vault_outstanding_transfers.to_json(),
            "fee_vault": str(self.fee_vault),
            "fee_vault_authority_pda_bump": self.fee_vault_authority_pda_bump,
            "fee_vault_outstanding_transfers": self.fee_vault_outstanding_transfers.to_json(),
            "init_margin_ratio": self.init_margin_ratio.to_json(),
            "maint_margin_ratio": self.maint_margin_ratio.to_json(),
            "account_deposit_limit": self.account_deposit_limit.to_json(),
            "lp_deposit_limit": self.lp_deposit_limit.to_json(),
            "reserved_space": self.reserved_space,
        }

    @classmethod
    def from_json(cls, obj: BankJSON) -> "Bank":
        return cls(
            scaling_factor_c=m_decimal.MDecimal.from_json(obj["scaling_factor_c"]),
            fixed_fee=m_decimal.MDecimal.from_json(obj["fixed_fee"]),
            interest_fee=m_decimal.MDecimal.from_json(obj["interest_fee"]),
            deposit_accumulator=m_decimal.MDecimal.from_json(
                obj["deposit_accumulator"]
            ),
            borrow_accumulator=m_decimal.MDecimal.from_json(obj["borrow_accumulator"]),
            last_update=obj["last_update"],
            native_deposit_balance=m_decimal.MDecimal.from_json(
                obj["native_deposit_balance"]
            ),
            native_borrow_balance=m_decimal.MDecimal.from_json(
                obj["native_borrow_balance"]
            ),
            mint=PublicKey(obj["mint"]),
            vault=PublicKey(obj["vault"]),
            vault_authority_pda_bump=obj["vault_authority_pda_bump"],
            insurance_vault=PublicKey(obj["insurance_vault"]),
            insurance_vault_authority_pda_bump=obj[
                "insurance_vault_authority_pda_bump"
            ],
            insurance_vault_outstanding_transfers=m_decimal.MDecimal.from_json(
                obj["insurance_vault_outstanding_transfers"]
            ),
            fee_vault=PublicKey(obj["fee_vault"]),
            fee_vault_authority_pda_bump=obj["fee_vault_authority_pda_bump"],
            fee_vault_outstanding_transfers=m_decimal.MDecimal.from_json(
                obj["fee_vault_outstanding_transfers"]
            ),
            init_margin_ratio=m_decimal.MDecimal.from_json(obj["init_margin_ratio"]),
            maint_margin_ratio=m_decimal.MDecimal.from_json(obj["maint_margin_ratio"]),
            account_deposit_limit=m_decimal.MDecimal.from_json(
                obj["account_deposit_limit"]
            ),
            lp_deposit_limit=m_decimal.MDecimal.from_json(obj["lp_deposit_limit"]),
            reserved_space=obj["reserved_space"],
        )
