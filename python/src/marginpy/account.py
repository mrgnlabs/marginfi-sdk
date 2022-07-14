import logging
from typing import Tuple

from anchorpy import AccountsCoder
from solana.publickey import PublicKey
from solana.rpc.async_api import AsyncClient
from solana.rpc.responses import AccountInfo
from solana.rpc.types import RPCResponse

from marginpy.generated_client.accounts import MarginfiAccount as MarginfiAccountDecoded
from marginpy.generated_client.types.lending_side import Deposit, Borrow
from marginpy.group import MarginfiGroup
from marginpy.client import MarginfiClient
from marginpy.utils import load_idl, UtpIndex, UtpData, json_to_account_info, b64str_to_bytes
from marginpy.decimal import Decimal


class MarginfiAccount:
    _pubkey: PublicKey
    _group: MarginfiGroup
    # TODO: observation_cache
    _client: MarginfiClient

    _authority: PublicKey
    _deposit_record: float
    _borrow_record: float

    # mango:
    # zo:

    def __init__(
            self,
            marginfi_account_pk: PublicKey,
            authority: PublicKey,
            client: MarginfiClient,
            group: MarginfiGroup,
            deposit_record: float,
            borrow_record: float,
            mango_utp_data,
            zo_utp_data,
    ) -> None:
        """
        [Internal] Constructor.

        :param marginfi_account_pk: address of the marginfi account
        :param authority: marginfi account authority
        :param client: marginfi client
        :param group: parent marginfi group
        :param deposit_record: marginfi account deposit record
        :param borrow_record: marginfi account borrow record
        """

        self._pubkey = marginfi_account_pk
        self._client = client
        self._authority = authority
        self._group = group

        # self.mango = UtpMangoAccount(client, self, mango_utp_data)
        # self.zo = UtpZoaccount(client, self, zo_utp_data)

        self._deposit_record = deposit_record
        self._borrow_record = borrow_record

    # --- Getters / Setters

    @property
    def pubkey(self):
        """Marginfi account address"""

        return self._pubkey

    @property
    def group(self):
        """Parent marginfi group address"""

        return self._group

    @property
    def client(self):
        """Marginfi client"""

        return self._client

    @property
    def authority(self):
        """Marginfi account authority address"""

        return self._authority

    @property
    def all_utps(self):
        """List of supported UTP proxy instances"""

        return [
            # self.mango,
            # self.zo
        ]

    @property
    def active_utps(self):
        """List of active UTP proxy instances"""

        filtered = filter(lambda x: x.is_active, self.all_utps)
        return list(filtered)

    @property
    def deposits(self):
        """Current GMA deposits"""

        return self.group.bank.compute_native_amount(self._deposit_record, Deposit)

    @property
    def borrows(self):
        """Current GMA borrows"""

        return self.group.bank.compute_native_amount(self._borrow_record, Borrow)

    # --- Getters / Setters (internal)

    @property
    def _program(self):
        """[Internal] Anchor program"""

        return self.client.program

    @property
    def _config(self):
        """[Internal] Marginfi client config"""

        return self.client.config

    # --- Factories

    @staticmethod
    async def fetch(
            marginfi_account_pk: PublicKey,
            client: MarginfiClient
    ):
        """
        MarginfiAccount network factory.
        Fetch account data according to the config and instantiate the corresponding MarginfiAccount.

        :param marginfi_account_pk: address of the target account
        :param client: marginfi client
        :returns: marginfi account instance
        """

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
            Decimal.from_account_data(account_data.deposit_record),
            Decimal.from_account_data(account_data.borrow_record),
            MarginfiAccount._pack_utp_data(account_data, UtpIndex.Mango),
            MarginfiAccount._pack_utp_data(account_data, UtpIndex.Zo)
        )

        # @todo logging may need to be taken to the finish line
        logging.debug(f"mfi:margin-account Loaded marginfi account {marginfi_account_pk}")

        return marginfi_account

    @staticmethod
    def from_account_data(
            marginfi_account_pk: PublicKey,
            client: MarginfiClient,
            account_data: MarginfiAccountDecoded,
            marginfi_group: MarginfiGroup
    ):
        """
        MarginfiAccount local factory (decoded)

        Instantiate a MarginfiAccount according to the provided decoded data.
        Check sanity against provided config.

        :param marginfi_account_pk: Address of the target account
        :param client: marginfi client
        :param account_data: decoded marginfi account data
        :param marginfi_group: marginfi group instance
        :returns: MarginfiAccount instance
        """

        if not (account_data.marginfi_group == client.config.group_pk):
            raise Exception(
                f"Marginfi account tied to group {account_data.marginfi_group}. Expected: {client.config.group_pk}"
            )

        return MarginfiAccount(
            marginfi_account_pk,
            account_data.authority,
            client,
            marginfi_group,
            Decimal.from_account_data(account_data.deposit_record).to_float(),
            Decimal.from_account_data(account_data.borrow_record).to_float(),
            MarginfiAccount._pack_utp_data(account_data, UtpIndex.Mango),
            MarginfiAccount._pack_utp_data(account_data, UtpIndex.Zo)
        )

    @staticmethod
    def from_account_data_raw(
            marginfi_account_pk: PublicKey,
            client: MarginfiClient,
            data: bytes,
            marginfi_group: MarginfiGroup
    ):
        """
        MarginfiAccount local factory (encoded)

        Instantiate a MarginfiGroup according to the provided encoded data.
        Check sanity against provided config.

        :param marginfi_account_pk: address of the target account
        :param client: marginfi client
        :param data: decoded marginfi account data
        :param marginfi_group: marginfi group instance
        :returns: MarginfiAccount instance
        """

        marginfi_account_data = MarginfiAccount.decode(data)
        return MarginfiAccount.from_account_data(
            marginfi_account_pk,
            client,
            marginfi_account_data,
            marginfi_group
        )

    # --- Others

    @staticmethod
    async def _fetch_account_data(
            marginfi_account_pk,
            config,
            rpc_client: AsyncClient  # @todo this is program: Program in ts sdk but unclear if that's a problem rn
    ):
        """
        [Internal] MarginfiAccount local factory (encoded)

        Fetch marginfi account data.
        Check sanity against provided config.

        :param marginfi_account_pk: address of the target account
        :param config: client config
        :param rpc_client: RPC client
        :returns: MarginfiAccount instance
        """

        data = await MarginfiAccountDecoded.fetch(rpc_client, marginfi_account_pk)
        if data is None:
            raise Exception(f"Account {config.group_pk} not found")
        if not (data.marginfi_group == config.group_pk):
            raise Exception(
                f"Marginfi account tied to group {data.marginfi_group}. Expected: {config.group_pk}")

        return data

    @staticmethod
    def _pack_utp_data(data: MarginfiAccountDecoded, utp_index: UtpIndex) -> UtpData:
        """
        [Internal] Pack data from the on-chain, vector format into a coherent unit.

        :param data: marginfi account data
        :param utp_index: index of the target UTP
        :returns: packed UTP data
        """

        return UtpData(account_config=data.utp_account_config[utp_index], is_active=data.active_utps[utp_index])

    @staticmethod
    def decode(encoded: bytes) -> MarginfiAccountDecoded:
        """
        Decode marginfi account data according to the Anchor IDL.

        :param encoded: raw data buffer
        :returns: decoded marginfi account data struct
        """

        return MarginfiAccountDecoded.decode(encoded)

    @staticmethod
    async def encode(decoded: MarginfiAccountDecoded) -> bytes:
        """
        Encode marginfi account data according to the Anchor IDL.

        :param decoded: decoded marginfi account data struct
        :returns: raw data buffer
        """

        coder = AccountsCoder(load_idl())
        return coder.build(decoded)

    async def reload(self, observe_utps=False) -> None:
        """
        Update instance data by fetching and storing the latest on-chain state.

        :param observe_utps: [optional] flag to request UTP observation as well
        """

        logging.debug(f"PublicKey: {self.pubkey}. Reloading account data")

        marginfi_group_ai, marginfi_account_ai = await self.load_group_and_account_ai()
        marginfi_account_data = MarginfiAccount.decode(b64str_to_bytes(marginfi_account_ai.data[0]))
        if not marginfi_account_data.marginfi_group == self._config.group_pk:
            raise Exception(f"Marginfi account tied to group {marginfi_account_data.marginfi_group},"
                            " Expected {self._config.group_pk}")
        self._group = MarginfiGroup.from_account_data_raw(
            self._config,
            self._program,
            b64str_to_bytes(marginfi_group_ai.data[0])
        )
        self._update_from_account_data(marginfi_account_data)
        # @todo
        # if observe_utps:
        # self.observe_utps()

    def _update_from_account_data(self, data: MarginfiAccountDecoded) -> None:
        """
        Update instance data from provided data struct.

        :param data: marginfi account data struct
        """

        self._authority = data.authority
        self._deposit_record = Decimal.from_account_data(data.deposit_record).to_float()
        self._borrow_record = Decimal.from_account_data(data.borrow_record).to_float()

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
    #         f"Observing UTP accounts for marginfi account: {self.pubkey.to_base58()}"
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

    async def load_group_and_account_ai(self) -> Tuple[AccountInfo, AccountInfo]:
        logging.debug(
            f"Loading marginfi account {self.pubkey}, and group {self._config.group_pk}"
        )

        pubkeys = [self._config.group_pk, self.pubkey]
        response: RPCResponse = await self._program.provider.connection.get_multiple_accounts(pubkeys)
        if 'error' in response.keys():
            raise Exception(f"Error while fetching {pubkeys}: {response['error']}")
        [marginfi_group_ai, marginfi_account_ai] = response['result']['value']
        if marginfi_group_ai is None:
            raise Exception(f"Marginfi group {self._config.group_pk} not found")
        if marginfi_account_ai is None:
            raise Exception(f"Marginfi account {self.pubkey} not found")

        return json_to_account_info(marginfi_group_ai), json_to_account_info(marginfi_account_ai)
