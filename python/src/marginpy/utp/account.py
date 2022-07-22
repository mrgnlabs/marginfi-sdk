from abc import ABC, abstractmethod, abstractproperty

from solana.publickey import PublicKey

from marginpy.generated_client.types.utp_account_config import UTPAccountConfig
from marginpy.generated_client.types.utp_config import UTPConfig
from marginpy import MarginfiClient, MarginfiAccount
from marginpy.utp.observation import UtpObservation
from marginpy.utils import get_utp_authority

from marginpy.constants import (
    INSURANCE_VAULT_LIQUIDATION_FEE,
    LIQUIDATOR_LIQUIDATION_FEE,
)


class UtpAccount(ABC):
    is_active: bool
    _utp_config: UTPAccountConfig
    _cached_observation: UtpObservation

    def __init__(
        self, 
        _client: MarginfiClient, 
        _marginfi_account: MarginfiAccount, 
        is_active: bool, 
        utp_config: UTPConfig
    ):
        self._client = _client
        self._marginfi_account = _marginfi_account
        self.is_active = is_active
        self._utp_config = utp_config
        self._cached_observation = UtpObservation.EMPTY_OBSERVATION

    @abstractmethod
    async def get_observation_accounts(self):
        pass

    @abstractmethod
    async def observe(self):
        pass

    @abstractmethod
    async def deposit(self, amount):
        pass

    @abstractmethod
    async def withdraw(self, amount):
        pass

    @abstractproperty
    def config(self):
        pass

    # --- Getters / Setters
    @property
    def index(self):
        return self.config.utp_index

    @property
    def _config(self):
        """[Internal]"""
        return self._client.config

    @property
    def _program(self):
        """[Internal]"""
        return self._client.program

    @property
    def cached_observation(self):
        # const fetchAge = (new Date().getTime() - this._cachedObservation.timestamp.getTime()) / 1000.0;
        # if (fetchAge > 5) {
        # console.log(`[WARNNG] Last ${UTP_NAME[this.index]} observation was fetched ${fetchAge} seconds ago`);
        # }
        # return this._cachedObservation;
        pass

    @property
    def equity(self):
        return self.cached_observation.equity

    @property
    def free_collateral(self):
        self.cached_observation.free_collateral

    @property
    def init_margin_requirement(self):
        self.cached_observation.init_margin_requirement

    @property
    def liquidation_value(self):
        self.cached_observation.liquidation_value

    @property
    def is_rebalance_deposit_needed(self):
        self.cached_observation.is_rebalance_deposit_needed

    @property
    def max_rebalance_deposit_amount(self):
        self.cached_observation.max_rebalance_deposit_amount

    @property
    def is_empty(self):
        self.cached_observation.is_empty

    @property
    def address(self):
        self._utp_config.address

    async def authority(
        self,
        seed: PublicKey = None
    ):
        """UTP authority (PDA)"""
        return get_utp_authority(
            self.config.program_id,
            seed if seed is not None else self._utp_config.authority_seed,
            self._program.program_id
        )

    # --- Others

    def compute_liquidation_prices(self):
        """Calculates liquidation parameters given an account value."""
        liquidator_fee = self.liquidation_value * LIQUIDATOR_LIQUIDATION_FEE
        insurance_vault_fee = self.liquidation_value * INSURANCE_VAULT_LIQUIDATION_FEE

        discounted_liquidator_price = self.liquidation_value - liquidator_fee
        final_price = discounted_liquidator_price - insurance_vault_fee

        return {final_price, discounted_liquidator_price, insurance_vault_fee}

    def update(self, data):
        """
        [Internal] Update instance data from provided data struct.
        """
        self.is_active = data.is_active
        self._utp_config = data.account_config

    def to_string(self):
        return f"""Timestamp: {self._cached_observation.timestamp}
                Equity: {self.equity}
                Free Collateral: {self.free_collateral}
                Liquidation Value: {self.liquidation_value}
                Rebalance Needed: {self.is_rebalance_deposit_needed}
                Max Rebalance: {self.max_rebalance_deposit_amount}
                Is empty: {self.is_empty}"""
