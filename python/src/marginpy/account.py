import logging

from anchorpy import AccountsCoder
from solana.publickey import PublicKey
from solana.rpc.async_api import AsyncClient

from marginpy.generated_client.accounts import MarginfiAccount as MarginfiAccountDecoded
from marginpy.group import MarginfiGroup
from marginpy.client import MarginfiClient
from marginpy.utils import get_idl
from marginpy.generated_client.types.lending_side import Borrow, Deposit
from marginpy.decimal import Decimal


class MarginfiAccount:
    public_key: PublicKey
    client: MarginfiClient
    # mango:
    # zo:
    _authority: PublicKey
    group: MarginfiGroup
    _deposit_record: float
    _borrow_record: float

    def __init__(
            self,
            marginfi_account_pk: PublicKey,
            authority: PublicKey,
            client,
            group: MarginfiGroup,
            deposit_record,
            borrow_record,
            mango_utp_data,
            zo_utp_data,
    ) -> None:
        """internal."""
        self.public_key = marginfi_account_pk
        self.client = client
        # self.mango = UtpMangoAccount(client, self, mango_utp_data)
        # self.zo = UtpZoaccount(client, self, zo_utp_data)
        self._authority = authority
        self.group = group
        self._deposit_record = deposit_record
        self._borrow_record = borrow_record

    # --- Getters / Setters

    ###
    # Marginfi account authority address
    ###
    @property
    def authority(self):
        return self._authority

    ### @internal
    @property
    def _program(self):
        return self.client.program

    ### @internal
    @property
    def _config(self):
        return self.client.config

    @property
    def all_utps(self):
        return [
            # self.mango,
            # self.zo
        ]

    @property
    def active_utps(self):
        filtered = filter(lambda x: x.is_active, self.all_utps)
        return list(filtered)

    @property
    def deposits(self):
        return self.group.bank.compute_native_amount(self._deposit_record, Deposit)

    @property
    def borrows(self):
        return self.group.bank.compute_native_amount(self._borrow_record, Borrow)

    # --- Factories

    ###
    # MarginfiAccount network factory
    #
    # Fetch account data according to the config and instantiate the corresponding MarginfiAccount.
    #
    # @param marginfiAccountPk Address of the target account
    # @param client marginfi client
    # @returns MarginfiAccount instance
    ###
    # @todo promises in py
    @staticmethod
    async def fetch(
            marginfi_account_pk: PublicKey,
            client: MarginfiClient
    ):

        account_data = await MarginfiAccount._fetch_account_data(
            marginfi_account_pk,
            client.config,
            client.program.provider.connection
        )

        marginfi_account = MarginfiAccount(
            marginfi_account_pk,
            account_data.authority,
            client,
            await MarginfiGroup.get(client.config, client.program),
            account_data.deposit_record,
            account_data.borrow_record,
            MarginfiAccount._pack_utp_data(account_data, 0),
            MarginfiAccount._pack_utp_data(account_data, 1)
        )

        # @todo logging may need to be taken to the finish line
        logging.debug(
            f"Loaded marginfi account {marginfi_account_pk.to_base58()}"
        )

        return marginfi_account

    ###
    # MarginfiAccount local factory (decoded)
    #
    # Instantiate a MarginfiAccount according to the provided decoded data.
    # Check sanity against provided config.
    #
    # @param marginfiAccountPk Address of the target account
    # @param client marginfi client
    # @param accountData Decoded marginfi marginfi account data
    # @param marginfiGroup MarginfiGroup instance
    # @returns MarginfiAccount instance
    ###
    @staticmethod
    def from_account_data(
            marginfi_account_pk: PublicKey,
            client: MarginfiClient,
            account_data: MarginfiAccountDecoded,
            marginfi_group: MarginfiGroup
    ):
        if not (account_data.marginfi_group == client.config.group_pk):
            raise Exception(
                f"Marginfi account tied to group {account_data.marginfi_group}. Expected: {client.config.group_pk}"
            )

        return MarginfiAccount(
            marginfi_account_pk,
            account_data.authority,
            client,
            marginfi_group,
            account_data.deposit_record,
            account_data.borrow_record,
            MarginfiAccount._pack_utp_data(account_data, 0),
            MarginfiAccount._pack_utp_data(account_data, 1)
        )

    ###
    # MarginfiAccount local factory (encoded)
    #
    # Instantiate a MarginfiAccount according to the provided encoded data.
    # Check sanity against provided config.
    #
    # @param marginfiAccountPk Address of the target account
    # @param config marginfi config
    # @param program marginfi Anchor program
    # @param marginfiAccountRawData Encoded marginfi marginfi account data
    # @param marginfiGroup MarginfiGroup instance
    # @returns MarginfiAccount instance
    ###
    @staticmethod
    def from_account_data_raw(
            marginfi_account_pk: PublicKey,
            client: MarginfiClient,
            marginfi_account_raw_data: bytes,
            marginfi_group: MarginfiGroup
    ):
        marginfi_account_data = MarginfiAccount.decode(marginfi_account_raw_data)

        return MarginfiAccount.from_account_data(
            marginfi_account_pk,
            client,
            marginfi_account_data,
            marginfi_group
        )

    # --- Others

    ###
    # Fetch marginfi account data.
    # Check sanity against provided config.
    #
    # @param config marginfi config
    # @param program marginfi Anchor program
    # @returns Decoded marginfi account data struct
    ###
    @staticmethod
    async def _fetch_account_data(
            account_address,
            config,
            client: AsyncClient #@todo this is program: Program in ts sdk but unclear if that's a problem rn
    ):
        data = await MarginfiAccountDecoded.fetch(client, account_address)
        if data is None:
            raise Exception(f"Account {config.group_pk} not found")
        if not (data.marginfi_group == config.group_pk):
            raise Exception(
                f"Marginfi account tied to group {data.marginfi_group}. Expected: {config.group_pk}")

        return data

    ###
    # Pack data from the on-chain, vector format into a coherent unit.
    #
    # @param data Marginfi account data
    # @param utpIndex Index of the target UTP
    # @returns UTP data struct
    ###
    @staticmethod
    def _pack_utp_data(data: MarginfiAccountDecoded, utp_index):
        
        return {
            "account_config": data.utp_account_config[utp_index],
            "is_active": data.active_utps[utp_index]
        }

    ###
    # Decode marginfi account data according to the Anchor IDL.
    #
    # @param encoded Raw data buffer
    # @returns Decoded marginfi account data struct
    ###
    @staticmethod
    def decode(buffer: bytes) -> MarginfiAccountDecoded:
        return MarginfiAccountDecoded.decode(buffer)

    ###
    # Decode marginfi account data according to the Anchor IDL.
    #
    # @param decoded Marginfi account data struct
    # @returns Raw data buffer
    ###
    @staticmethod
    async def encode(decoded: MarginfiAccountDecoded):
        coder = AccountsCoder(get_idl())
        return coder.build(decoded)

    ###
    # Update instance data by fetching and storing the latest on-chain state.
    ###
    async def reload(self, observe_utps = False):
        logging.debug(
            f"PublicKey: {self.public_key.to_base58()}. Reloading account data"
        )

        [ marginfi_group_ai, marginfi_account_ai ] = self.load_group_and_account_ai()
        # @todo this may not be .data
        marginfi_account_data = MarginfiAccount.decode(marginfi_account_ai.data)
        # @todo check that types here are correct
        if not marginfi_account_data.marginfi_group == self._config.group_pk:
            raise Exception(
                f"Marginfi account tied to group {marginfi_account_data.marginfi_group.to_base58()}, Expected {self._config.group_pk.to_base58()}"
            )
        self.group = MarginfiGroup.from_account_data_raw(
            self._config,
            self._program,
            marginfi_group_ai.data
        )
        self._update_from_account_data(marginfi_account_data)
        # @todo
        # if observe_utps:
            # self.observe_utps()

    ###
    # Update instance data from provided data struct.
    #
    # @param data Marginfi account data struct
    ###
    def _update_from_account_data(self, data: MarginfiAccountDecoded):
        self._authority = data.authority
        self._deposit_record = Decimal.from_account_data(data.deposit_record)
        self._borrow_record = Decimal.from_account_data(data.borrow_record)
        
        # self.mango.update(...)
        # self.zo.update(...)

    ###
    # Create transaction instruction to deposit collateral into the marginfi account.
    #
    # @param amount Amount to deposit (mint native unit)
    # @returns `MarginDepositCollateral` transaction instruction
    ###
    # @todo can amount be float here?
    # async def make_deposit_ix(amount: float):
        


    ###
    # Refresh and retrieve the health cache for all active UTPs directly from the UTPs.
    #
    # @returns List of health caches for all active UTPs
    ###
    # async def observe_utps(self):
    #     logging.debug(
    #         f"Observing UTP accounts for marginfi account: {self.public_key.to_base58()}"
    #     )

    #     observations = []
    #     for utp in self.active_utps:
    #         #@todo double check this await
    #         observations.append(
    #             {
    #                 "utp_index": utp.index,
    #                 "observation": await utp.observe()
    #             }
    #         )



    async def load_group_and_account_ai(self):
        logging.debug(
            f"Loading marginfi account {self.public_key.to_base58()}, and group {self._config.group_pk.to_base58()}"
        )

        [ marginfi_group_ai, marginfi_account_ai ] = self._program.account["Data"].fetch_multiple(
            [
                self._config.group_pk,
                self.public_key,
            ],
            batch_size=2
        )

        if not marginfi_account_ai:
            raise Exception(
                f"Marginfi account not found"
            )
        
        if not marginfi_group_ai:
            raise Exception(
                f"Marginfi Group Account not found"
            )

        return [ marginfi_group_ai, marginfi_account_ai ]

    