import json
import os

from anchorpy import Program, AccountsCoder, Idl
from solana.publickey import PublicKey
from marginpy.bank import Bank
from marginpy.config import MarginfiConfig
from marginpy.generated_client.accounts import MarginfiGroup as MarginfiGroupDecoded
from marginpy.utils import get_idl


class MarginfiGroup:
    public_key: PublicKey

    def __init__(
            self,
            config: MarginfiConfig,
            program: Program,
            admin: PublicKey,
            bank: Bank,
    ) -> None:
        self.public_key = config.group_pk
        self._config = config
        self._program = program
        self._admin = admin
        self._bank = bank

    # --- Factories

    ###
    # MarginfiGroup network factory
    #
    # Fetch account data according to the config and instantiate the corresponding MarginfiGroup.
    #
    # @param config marginfi config
    # @param program marginfi Anchor program
    # @return MarginfiGroup instance
    ###
    @staticmethod
    async def get(
            config: MarginfiConfig,
            program: Program,
    ):
        account_data = await MarginfiGroup.__fetch_account_data(config, program)
        return MarginfiGroup(
            config,
            program,
            account_data.admin,
            Bank(account_data.bank)
        )

    ###
    # MarginfiGroup local factory (decoded)
    #
    # Instantiate a MarginfiGroup according to the provided decoded data.
    # Check sanity against provided config.
    #
    # @param config marginfi config
    # @param program marginfi Anchor program
    # @param accountData Decoded marginfi group data
    # @return MarginfiGroup instance
    ###
    @staticmethod
    def from_account_data(
            config: MarginfiConfig,
            program: Program,
            account_raw: MarginfiGroupDecoded
    ):
        if not (account_raw.bank.mint == config.collateral_mint_pk):
            raise Exception(
                f"Marginfi group uses collateral {account_raw.bank.mint}. Expected: {config.collateral_mint_pk}")

        return MarginfiGroup(
            config,
            program,
            account_raw.admin,
            Bank(account_raw.bank)
        )

    ###
    # MarginfiGroup local factory (encoded)
    #
    # Instantiate a MarginfiGroup according to the provided encoded data.
    # Check sanity against provided config.
    #
    # @param config marginfi config
    # @param program marginfi Anchor program
    # @param data Encoded marginfi group data
    # @return MarginfiGroup instance
    ###
    @staticmethod
    def from_account_data_raw(
            config: MarginfiConfig,
            program: Program,
            buffer: bytes
    ):
        data = MarginfiGroup.decode(buffer)
        return MarginfiGroup.from_account_data(config, program, data)

    # --- Getters and setters

    ###
    # marginfi group admin address
    ###
    @property
    def admin(self) -> PublicKey:
        return self._admin

    ###
    # marginfi group Bank
    ###
    @property
    def bank(self) -> Bank:
        return self._bank

    # --- Others

    ###
    # Fetch marginfi group account data according to the config.
    # Check sanity against provided config.
    #
    # @param config marginfi config
    # @param program marginfi Anchor program
    # @return Decoded marginfi group account data struct
    ###
    @staticmethod
    async def __fetch_account_data(
            config: MarginfiConfig,
            program: Program
    ) -> MarginfiGroupDecoded:
        data = await MarginfiGroupDecoded.fetch(program.provider.connection, config.group_pk)
        if data is None:
            raise Exception(f"Account {config.group_pk} not found")
        if data.bank.mint != config.collateral_mint_pk:
            raise Exception(
                f"Marginfi group uses collateral {data.bank.mint}. Expected: {config.collateral_mint_pk}")

        return data

    ###
    # Decode marginfi group account data according to the Anchor IDL.
    #
    # @param encoded Raw data buffer
    # @return Decoded marginfi group account data struct
    ###
    @staticmethod
    def decode(buffer: bytes) -> MarginfiGroupDecoded:
        return MarginfiGroupDecoded.decode(buffer)

    ###
    # Encode marginfi group account data according to the Anchor IDL.
    #
    # @param decoded Encoded marginfi group account data buffer
    # @return Raw data buffer
    ###
    @staticmethod
    def encode(decoded: MarginfiGroupDecoded) -> bytes:
        coder = AccountsCoder(get_idl())
        return coder.build(decoded)

    ###
    # Update instance data by fetching and storing the latest on-chain state.
    ###
    async def fetch(self):
        group_decoded = await MarginfiGroup.__fetch_account_data(self._config, self._program)
        self._admin = group_decoded.admin
        self._bank = Bank(group_decoded.bank)
