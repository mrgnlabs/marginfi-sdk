from __future__ import annotations

import typing
from dataclasses import dataclass

import borsh_construct as borsh
from construct import Container


class BankConfigJSON(typing.TypedDict):
    scaling_factor_c: typing.Optional[int]
    fixed_fee: typing.Optional[int]
    interest_fee: typing.Optional[int]
    init_margin_ratio: typing.Optional[int]
    maint_margin_ratio: typing.Optional[int]
    account_deposit_limit: typing.Optional[int]
    lp_deposit_limit: typing.Optional[int]


@dataclass
class BankConfig:
    layout: typing.ClassVar = borsh.CStruct(
        "scaling_factor_c" / borsh.Option(borsh.U64),
        "fixed_fee" / borsh.Option(borsh.U64),
        "interest_fee" / borsh.Option(borsh.U64),
        "init_margin_ratio" / borsh.Option(borsh.U64),
        "maint_margin_ratio" / borsh.Option(borsh.U64),
        "account_deposit_limit" / borsh.Option(borsh.U64),
        "lp_deposit_limit" / borsh.Option(borsh.U64),
    )
    scaling_factor_c: typing.Optional[int]
    fixed_fee: typing.Optional[int]
    interest_fee: typing.Optional[int]
    init_margin_ratio: typing.Optional[int]
    maint_margin_ratio: typing.Optional[int]
    account_deposit_limit: typing.Optional[int]
    lp_deposit_limit: typing.Optional[int]

    @classmethod
    def from_decoded(cls, obj: Container) -> "BankConfig":
        return cls(
            scaling_factor_c=obj.scaling_factor_c,
            fixed_fee=obj.fixed_fee,
            interest_fee=obj.interest_fee,
            init_margin_ratio=obj.init_margin_ratio,
            maint_margin_ratio=obj.maint_margin_ratio,
            account_deposit_limit=obj.account_deposit_limit,
            lp_deposit_limit=obj.lp_deposit_limit,
        )

    def to_encodable(self) -> dict[str, typing.Any]:
        return {
            "scaling_factor_c": self.scaling_factor_c,
            "fixed_fee": self.fixed_fee,
            "interest_fee": self.interest_fee,
            "init_margin_ratio": self.init_margin_ratio,
            "maint_margin_ratio": self.maint_margin_ratio,
            "account_deposit_limit": self.account_deposit_limit,
            "lp_deposit_limit": self.lp_deposit_limit,
        }

    def to_json(self) -> BankConfigJSON:
        return {
            "scaling_factor_c": self.scaling_factor_c,
            "fixed_fee": self.fixed_fee,
            "interest_fee": self.interest_fee,
            "init_margin_ratio": self.init_margin_ratio,
            "maint_margin_ratio": self.maint_margin_ratio,
            "account_deposit_limit": self.account_deposit_limit,
            "lp_deposit_limit": self.lp_deposit_limit,
        }

    @classmethod
    def from_json(cls, obj: BankConfigJSON) -> "BankConfig":
        return cls(
            scaling_factor_c=obj["scaling_factor_c"],
            fixed_fee=obj["fixed_fee"],
            interest_fee=obj["interest_fee"],
            init_margin_ratio=obj["init_margin_ratio"],
            maint_margin_ratio=obj["maint_margin_ratio"],
            account_deposit_limit=obj["account_deposit_limit"],
            lp_deposit_limit=obj["lp_deposit_limit"],
        )
