from abc import ABC, abstractmethod, abstractproperty

from solana.publickey import PublicKey

from marginpy.constants import (
    INSURANCE_VAULT_LIQUIDATION_FEE,
    LIQUIDATOR_LIQUIDATION_FEE,
)


class UtpAccount(ABC):
    is_active: bool

    # _utp_config: UTPAccountConfig
    # _cached_observation: UtpObservation

    def __init__(self, _client, _marginfi_account, is_active, utp_config):
        self._client = _client
        self._marginfi_account = _marginfi_account
        self.is_active = is_active
        self._utp_config = utp_config
        # @todo
        # self._cached_observation =

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

    # @todo confirm this is right
    @property
    @abstractmethod
    def config(self):
        pass

    # --- Getters / Setters
    @property
    def index(self):
        return self.config.utp_index

    # internal
    @property
    def _config(self):
        return self._client.config

    # internal
    @property
    def _program(self):
        return self._client.program

    # @property
    # def cached_observation(self):
    #     pass

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

    ###
    # UTP authority (PDA)
    ###
    # async def authority(
    #     self,
    #     seed: PublicKey = None
    # ):
    #     return get_utp_authority(
    #         self.config.program_id,
    #         seed || self._utp_config.authority_seed,
    #         self._program.program_id
    #     )

    # --- Others

    ###
    # Calculates liquidation parameters given an account value.
    ###
    def compute_liquidation_prices(self):
        liquidator_fee = self.liquidation_value * LIQUIDATOR_LIQUIDATION_FEE
        insurance_vault_fee = self.liquidation_value * INSURANCE_VAULT_LIQUIDATION_FEE

        discounted_liquidator_price = self.liquidation_value - liquidator_fee
        final_price = discounted_liquidator_price - insurance_vault_fee

        return {final_price, discounted_liquidator_price, insurance_vault_fee}

    ###
    # Update instance data from provided data struct.
    #
    # @internal
    ###
    def update(self, data):
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
