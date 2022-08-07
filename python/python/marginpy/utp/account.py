from __future__ import annotations

from abc import ABC, abstractmethod
from datetime import datetime
from typing import TYPE_CHECKING, List, Tuple

import spl.token.instructions as spl_token_ixs
from anchorpy import Program
from marginpy.constants import (
    INSURANCE_VAULT_LIQUIDATION_FEE,
    LIQUIDATOR_LIQUIDATION_FEE,
)
from marginpy.generated_client.types.utp_account_config import UTPAccountConfig
from marginpy.logger import get_logger
from marginpy.types import (
    UTP_NAME,
    InstructionsWrapper,
    LiquidationPrices,
    UtpConfig,
    UtpData,
    UtpIndex,
)
from marginpy.utils.pda import get_utp_authority
from marginpy.utp.observation import EMPTY_OBSERVATION, UtpObservation
from solana import system_program
from solana.keypair import Keypair
from solana.publickey import PublicKey
from solana.transaction import AccountMeta, TransactionSignature
from spl.token.constants import ACCOUNT_LEN, TOKEN_PROGRAM_ID

if TYPE_CHECKING:
    from marginpy import MarginfiAccount, MarginfiClient, MarginfiConfig


class UtpAccount(ABC):
    """
    [internal] Abstract class for common behaviour in UTP proxies.
    """

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
    async def deposit(self, ui_amount: float) -> TransactionSignature:
        pass

    @abstractmethod
    async def withdraw(self, ui_amount: float) -> TransactionSignature:
        pass

    # --- Getters / Setters

    @property
    @abstractmethod
    def config(self) -> UtpConfig:
        pass

    @property
    def index(self) -> UtpIndex:
        return self.config.utp_index

    @property
    def _config(self) -> MarginfiConfig:
        return self._client.config

    @property
    def _program(self) -> Program:
        return self._client.program

    @property
    def cached_observation(self) -> UtpObservation:
        fetch_age = (
            datetime.now() - self._cached_observation.timestamp
        ).total_seconds()
        if fetch_age > 5:
            logger = get_logger(f"{__name__}.UtpAccount.{UTP_NAME[self.index]}")
            logger.warning(
                "Last %s observation was fetched %s seconds ago",
                UTP_NAME[self.index],
                fetch_age,
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

    async def authority(self, seed: PublicKey = None) -> Tuple[PublicKey, int]:
        """
        Gets UTP authority (PDA).

        Args:
            seed (PublicKey, optional): seed required only at UTP activation. Defaults to None.
        """

        return get_utp_authority(
            self.config.program_id,
            seed if seed is not None else self._utp_config.authority_seed,
            self._program.program_id,
        )

    # --- Others

    def compute_liquidation_prices(self) -> LiquidationPrices:
        """
        Calculates liquidation parameters given an account value.
        """

        liquidator_fee = self.liquidation_value * LIQUIDATOR_LIQUIDATION_FEE
        insurance_vault_fee = self.liquidation_value * INSURANCE_VAULT_LIQUIDATION_FEE

        discounted_liquidator_price = self.liquidation_value - liquidator_fee
        final_price = discounted_liquidator_price - insurance_vault_fee

        return LiquidationPrices(
            final_price=final_price,
            discounted_liquidator_price=discounted_liquidator_price,
            insurance_vault_fee=insurance_vault_fee,
        )

    def _update(self, data: UtpData) -> None:
        """
        [internal] Update instance data from provided data struct.
        """

        self.is_active = data.is_active
        self._utp_config = data.account_config

    def throw_if_not_active(self):
        if not self.is_active:
            raise Exception("Utp isn't active")

    async def make_create_proxy_token_account_ixs(
        self, proxy_token_account_key: Keypair, utp_authority_pk: PublicKey
    ) -> InstructionsWrapper:
        create_token_account_ix = system_program.create_account(
            system_program.CreateAccountParams(
                from_pubkey=self._program.provider.wallet.public_key,
                new_account_pubkey=proxy_token_account_key.public_key,
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
                account=proxy_token_account_key.public_key,
                owner=utp_authority_pk,
            )
        )
        return InstructionsWrapper(
            instructions=[create_token_account_ix, init_token_account_ix], signers=[]
        )
