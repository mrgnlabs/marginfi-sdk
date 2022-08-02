from __future__ import annotations

from abc import ABC, abstractmethod
from datetime import datetime
from typing import TYPE_CHECKING, List

import spl.token.instructions as spl_token_ixs
from anchorpy import Program
from marginpy.constants import (
    INSURANCE_VAULT_LIQUIDATION_FEE,
    LIQUIDATOR_LIQUIDATION_FEE,
)
from marginpy.generated_client.types.utp_account_config import UTPAccountConfig
from marginpy.types import UTP_NAME, LiquidationPrices, UtpConfig, UtpData, UtpIndex
from marginpy.utils.pda import get_utp_authority
from marginpy.utp.observation import EMPTY_OBSERVATION, UtpObservation
from solana import system_program
from solana.publickey import PublicKey
from solana.transaction import AccountMeta, TransactionInstruction, TransactionSignature
from spl.token.constants import ACCOUNT_LEN, TOKEN_PROGRAM_ID

if TYPE_CHECKING:
    from marginpy import MarginfiAccount, MarginfiClient, MarginfiConfig


class UtpAccount(ABC):
    _client: MarginfiClient
    _marginfi_account: MarginfiAccount
    is_active: bool
    _utp_config: UTPAccountConfig
    _cached_observation: UtpObservation

    def __init__(
        self,
        client: "MarginfiClient",
        marginfi_account: "MarginfiAccount",
        is_active: bool,
        utp_config: UTPAccountConfig,
    ):
        self._client = client
        self._marginfi_account = marginfi_account
        self.is_active = is_active
        self._utp_config = utp_config
        self._cached_observation = EMPTY_OBSERVATION

    def __str__(self) -> str:
        return (
            f"Timestamp: {self._cached_observation.timestamp}"
            f"Equity: {self.equity}"
            f"Free Collateral: {self.free_collateral}"
            f"Liquidation Value: {self.liquidation_value}"
            f"Rebalance Needed: {self.is_rebalance_deposit_needed}"
            f"Max Rebalance: {self.max_rebalance_deposit_amount}"
            f"Is empty: {self.is_empty}"
        )

    @abstractmethod
    async def get_observation_accounts(self) -> List[AccountMeta]:
        pass

    @abstractmethod
    async def observe(self) -> UtpObservation:
        pass

    @abstractmethod
    async def deposit(self, amount) -> TransactionSignature:
        pass

    @abstractmethod
    async def withdraw(self, amount) -> TransactionSignature:
        pass

    @property
    @abstractmethod
    def config(self) -> UtpConfig:
        pass

    # --- Getters / Setters

    @property
    def index(self) -> UtpIndex:
        return self.config.utp_index

    @property
    def _config(self) -> MarginfiConfig:
        """[Internal]"""
        return self._client.config

    @property
    def _program(self) -> Program:
        """[Internal]"""
        return self._client.program

    @property
    def cached_observation(self) -> UtpObservation:
        # TODO
        fetch_age = datetime.now().timestamp() - self._cached_observation.timestamp
        if fetch_age > 5:
            print(
                f"[WARNNG] Last {UTP_NAME[self.index]} observation was fetched"
                f" {fetch_age} seconds ago"
            )
        return self._cached_observation

    @property
    def equity(self) -> float:
        return self.cached_observation.equity

    @property
    def free_collateral(self) -> float:
        return self.cached_observation.free_collateral

    @property
    def init_margin_requirement(self) -> float:
        return self.cached_observation.init_margin_requirement

    @property
    def liquidation_value(self) -> float:
        return self.cached_observation.liquidation_value

    @property
    def is_rebalance_deposit_needed(self) -> bool:
        return self.cached_observation.is_rebalance_deposit_needed

    @property
    def max_rebalance_deposit_amount(self) -> float:
        return self.cached_observation.max_rebalance_deposit_amount

    @property
    def is_empty(self) -> bool:
        return self.cached_observation.is_empty

    @property
    def address(self) -> PublicKey:
        return self._utp_config.address

    async def authority(self, seed: PublicKey = None):
        """UTP authority (PDA)"""

        return get_utp_authority(
            self.config.program_id,
            seed if seed is not None else self._utp_config.authority_seed,
            self._program.program_id,
        )

    # --- Others

    def compute_liquidation_prices(self) -> LiquidationPrices:
        """Calculates liquidation parameters given an account value."""

        liquidator_fee = self.liquidation_value * LIQUIDATOR_LIQUIDATION_FEE
        insurance_vault_fee = self.liquidation_value * INSURANCE_VAULT_LIQUIDATION_FEE

        discounted_liquidator_price = self.liquidation_value - liquidator_fee
        final_price = discounted_liquidator_price - insurance_vault_fee

        return LiquidationPrices(
            final_price=final_price,
            discounted_liquidator_price=discounted_liquidator_price,
            insurance_vault_fee=insurance_vault_fee,
        )

    def update(self, data: UtpData) -> None:
        """
        [Internal] Update instance data from provided data struct.
        """

        self.is_active = data.is_active
        self._utp_config = data.account_config

    def verify_active(self):
        """[Internal]"""

        if not self.is_active:
            raise Exception("Utp isn't active")

    async def make_create_proxy_token_account_ixs(
        self, proxy_token_account_key_pk, mango_authority_pk
    ) -> List[TransactionInstruction]:
        create_token_account_ix = system_program.create_account(
            system_program.CreateAccountParams(
                from_pubkey=self._program.provider.wallet.public_key,
                new_account_pubkey=proxy_token_account_key_pk,
                lamports=int(
                    (
                        await self._program.provider.connection.get_minimum_balance_for_rent_exemption(
                            ACCOUNT_LEN
                        )
                    )["result"]
                ),
                space=ACCOUNT_LEN,
                program_id=TOKEN_PROGRAM_ID,
            )
        )
        init_token_account_ix = spl_token_ixs.initialize_account(
            spl_token_ixs.InitializeAccountParams(
                program_id=TOKEN_PROGRAM_ID,
                mint=self._marginfi_account.group.bank.mint,
                account=proxy_token_account_key_pk,
                owner=mango_authority_pk,
            )
        )
        return [create_token_account_ix, init_token_account_ix]
