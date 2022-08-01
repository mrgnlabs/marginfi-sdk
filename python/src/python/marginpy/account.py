import logging
from typing import TYPE_CHECKING, List, Tuple

from anchorpy import AccountsCoder
from marginpy.constants import COLLATERAL_SCALING_FACTOR
from marginpy.generated_client.accounts import MarginfiAccount as MarginfiAccountData
from marginpy.generated_client.types.lending_side import Borrow, Deposit
from marginpy.group import MarginfiGroup
from marginpy.instructions import (
    DeactivateUtpAccounts,
    DeactivateUtpArgs,
    DepositAccounts,
    DepositArgs,
    HandleBankruptcyAccounts,
    WithdrawAccounts,
    WithdrawArgs,
    make_deactivate_utp_ix,
    make_deposit_ix,
    make_handle_bankruptcy_ix,
    make_withdraw_ix,
)
from marginpy.types import UtpData, UtpIndex
from marginpy.utils import (
    BankVaultType,
    b64str_to_bytes,
    get_bank_authority,
    json_to_account_info,
    load_idl,
    ui_to_native,
    wrapped_fixed_to_float,
)
from marginpy.utp.mango import UtpMangoAccount
from marginpy.utp.zo import UtpZoAccount
from solana.publickey import PublicKey
from solana.rpc.async_api import AsyncClient
from solana.rpc.responses import AccountInfo
from solana.rpc.types import RPCResponse
from solana.transaction import (
    AccountMeta,
    Transaction,
    TransactionInstruction,
    TransactionSignature,
)
from spl.token.instructions import get_associated_token_address

if TYPE_CHECKING:
    from marginpy.client import MarginfiClient
    from marginpy.config import MarginfiConfig


class MarginfiAccount:
    _pubkey: PublicKey
    _group: MarginfiGroup
    # TODO: observation_cache
    _client: "MarginfiClient"

    _authority: PublicKey
    _deposit_record: float
    _borrow_record: float

    mango: UtpMangoAccount
    zo: UtpZoAccount

    def __init__(  # pylint: disable=too-many-arguments
        self,
        marginfi_account_pk: PublicKey,
        authority: PublicKey,
        client: "MarginfiClient",
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

        self.mango = UtpMangoAccount(client, self, mango_utp_data)
        self.zo = UtpZoAccount(client, self, zo_utp_data)

        self._deposit_record = deposit_record
        self._borrow_record = borrow_record

    # --- Factories

    @staticmethod
    async def fetch(marginfi_account_pk: PublicKey, client: "MarginfiClient"):
        """
        MarginfiAccount network factory.
        Fetch account data according to the config and instantiate the corresponding MarginfiAccount.

        :param marginfi_account_pk: address of the target account
        :param client: marginfi client
        :returns: marginfi account instance
        """

        account_data = await MarginfiAccount._fetch_account_data(
            marginfi_account_pk, client.config, client.program.provider.connection
        )

        marginfi_account = MarginfiAccount(
            marginfi_account_pk,
            account_data.authority,
            client,
            await MarginfiGroup.fetch(client.config, client.program),
            wrapped_fixed_to_float(account_data.deposit_record)
            / COLLATERAL_SCALING_FACTOR,
            wrapped_fixed_to_float(account_data.borrow_record)
            / COLLATERAL_SCALING_FACTOR,
            MarginfiAccount._pack_utp_data(account_data, UtpIndex.MANGO),
            MarginfiAccount._pack_utp_data(account_data, UtpIndex.ZO),
        )

        # @todo logging may need to be taken to the finish line
        logging.debug(
            "mfi:margin-account Loaded marginfi account %s", marginfi_account_pk
        )

        return marginfi_account

    @staticmethod
    def from_account_data(
        marginfi_account_pk: PublicKey,
        client: "MarginfiClient",
        account_data: MarginfiAccountData,
        marginfi_group: MarginfiGroup,
    ):
        """
        MarginfiAccount local factory (decoded)

        Instantiate a MarginfiAccount according to the provided decoded data.
        Check sanity against provided config.

        :param marginfi_account_pk: Address of the target account
        :param client: marginfi client
        :param account_data: decoded marginfi account data
        :param marginfi_group: marginfi group instance
        :returns: marginfi account instance
        """

        if not account_data.marginfi_group == client.config.group_pk:
            raise Exception(
                f"Marginfi account tied to group {account_data.marginfi_group}."
                f" Expected: {client.config.group_pk}"
            )

        return MarginfiAccount(
            marginfi_account_pk,
            account_data.authority,
            client,
            marginfi_group,
            wrapped_fixed_to_float(account_data.deposit_record)
            / COLLATERAL_SCALING_FACTOR,
            wrapped_fixed_to_float(account_data.borrow_record)
            / COLLATERAL_SCALING_FACTOR,
            MarginfiAccount._pack_utp_data(account_data, UtpIndex.MANGO),
            MarginfiAccount._pack_utp_data(account_data, UtpIndex.ZO),
        )

    @staticmethod
    def from_account_data_raw(
        marginfi_account_pk: PublicKey,
        client: "MarginfiClient",
        data: bytes,
        marginfi_group: MarginfiGroup,
    ):
        """
        MarginfiAccount local factory (encoded)

        Instantiate a MarginfiGroup according to the provided encoded data.
        Check sanity against provided config.

        :param marginfi_account_pk: address of the target account
        :param client: marginfi client
        :param data: decoded marginfi account data
        :param marginfi_group: marginfi group instance
        :returns: marginfi account instance
        """

        marginfi_account_data = MarginfiAccount.decode(data)
        return MarginfiAccount.from_account_data(
            marginfi_account_pk, client, marginfi_account_data, marginfi_group
        )

    # --- Getters / Setters

    @property
    def pubkey(self):
        """Marginfi account address"""

        return self._pubkey

    @property
    def group(self):
        """Parent marginfi group"""

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

        return [self.mango, self.zo]

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

    # --- Others

    @staticmethod
    async def _fetch_account_data(
        marginfi_account_pk: PublicKey,
        config: "MarginfiConfig",
        rpc_client: AsyncClient,
    ):
        """
        [Internal] MarginfiAccount local factory (encoded)

        Fetch marginfi account data.
        Check sanity against provided config.

        :param marginfi_account_pk: address of the target account
        :param config: client config
        :param rpc_client: RPC client
        :returns: marginfi account instance
        """

        data = await MarginfiAccountData.fetch(
            rpc_client,
            marginfi_account_pk,
            program_id=config.program_id,
            commitment=rpc_client.commitment,
        )
        if data is None:
            raise Exception(f"Account {marginfi_account_pk} not found")
        if not data.marginfi_group == config.group_pk:
            raise Exception(
                f"Marginfi account tied to group {data.marginfi_group}. Expected:"
                f" {config.group_pk}"
            )

        return data

    @staticmethod
    def _pack_utp_data(data: MarginfiAccountData, utp_index: UtpIndex) -> UtpData:
        """
        [Internal] Pack data from the on-chain, vector format into a coherent unit.

        :param data: marginfi account data
        :param utp_index: index of the target UTP
        :returns: packed UTP data
        """
        return UtpData(
            account_config=data.utp_account_config[utp_index],
            is_active=data.active_utps[utp_index],
        )

    @staticmethod
    def decode(encoded: bytes) -> MarginfiAccountData:
        """
        Decode marginfi account data according to the Anchor IDL.

        :param encoded: raw data buffer
        :returns: decoded marginfi account data struct
        """

        return MarginfiAccountData.decode(encoded)

    @staticmethod
    async def encode(decoded: MarginfiAccountData) -> bytes:
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

        logging.debug("PublicKey: %s. Reloading account data", self.pubkey)

        marginfi_group_ai, marginfi_account_ai = await self.load_group_and_account_ai()
        marginfi_account_data = MarginfiAccount.decode(b64str_to_bytes(marginfi_account_ai.data[0]))  # type: ignore
        if not marginfi_account_data.marginfi_group == self._config.group_pk:
            raise Exception(
                "Marginfi account tied to group"
                f" {marginfi_account_data.marginfi_group}, Expected"
                " {self._config.group_pk}"
            )
        self._group = MarginfiGroup.from_account_data_raw(
            self._config,
            self._program,
            b64str_to_bytes(marginfi_group_ai.data[0]),  # type: ignore
        )
        self._update_from_account_data(marginfi_account_data)

        if observe_utps:
            pass  # self.observe_utps()

    def _update_from_account_data(self, data: MarginfiAccountData) -> None:
        """
        Update instance data from provided data struct.

        :param data: marginfi account data struct
        """

        self._authority = data.authority
        self._deposit_record = (
            wrapped_fixed_to_float(data.deposit_record) / COLLATERAL_SCALING_FACTOR
        )
        self._borrow_record = (
            wrapped_fixed_to_float(data.borrow_record) / COLLATERAL_SCALING_FACTOR
        )

        self.mango.update(self._pack_utp_data(data, UtpIndex.MANGO))
        self.zo.update(self._pack_utp_data(data, UtpIndex.ZO))

    async def get_observation_accounts(self) -> List[AccountMeta]:
        accounts = []
        for utp in self.active_utps:
            accounts.extend(await utp.get_observation_accounts())
        print(f"Loading {len(accounts)} observation accounts")
        return accounts

    # --- Deposit to GMA

    async def make_deposit_ix(self, amount: float) -> TransactionInstruction:
        """
        Create transaction instruction to deposit collateral into the marginfi account.

        :param amount: amount to deposit (UI unit)
        :returns: transaction instruction
        """

        user_ata = get_associated_token_address(
            self._program.provider.wallet.public_key, self.group.bank.mint
        )
        remaining_accounts = await self.get_observation_accounts()
        return make_deposit_ix(
            DepositArgs(amount=ui_to_native(amount)),
            DepositAccounts(
                marginfi_group=self.group.pubkey,
                marginfi_account=self.pubkey,
                funding_account=user_ata,
                authority=self._program.provider.wallet.public_key,
                bank_vault=self.group.bank.vault,
            ),
            self.client.program_id,
            remaining_accounts,
        )

    async def deposit(self, amount: float) -> TransactionSignature:
        """
        Deposit collateral into the marginfi account.

        :param amount: amount to deposit (UI unit)
        :returns: transaction signature
        """

        deposit_ix = await self.make_deposit_ix(amount)
        tx = Transaction().add(deposit_ix)
        return await self._program.provider.send(tx)

    # --- Withdraw from GMA

    async def make_withdraw_ix(self, amount: float) -> TransactionInstruction:
        """
        Create transaction instruction to withdraw collateral from the marginfi account.

        :param amount: amount to withdraw (mint native unit)
        :returns: `MarginWithdrawCollateral` transaction instruction
        """

        user_ata = get_associated_token_address(
            self._program.provider.wallet.public_key, self.group.bank.mint
        )
        margin_bank_authority_pk, _ = get_bank_authority(
            self._config.group_pk, self._program.program_id
        )
        remaining_accounts = await self.get_observation_accounts()

        return make_withdraw_ix(
            WithdrawArgs(amount=ui_to_native(amount)),
            WithdrawAccounts(
                marginfi_group=self.group.pubkey,
                marginfi_account=self.pubkey,
                authority=self._program.provider.wallet.public_key,
                bank_vault=self.group.bank.vault,
                bank_vault_authority=margin_bank_authority_pk,
                receiving_token_account=user_ata,
            ),
            self.client.program_id,
            remaining_accounts,
        )

    async def withdraw(self, amount: float) -> TransactionSignature:
        """
        Withdraw collateral from the marginfi account.

        :param amount: amount to withdraw (mint native unit)
        :returns: transaction signature
        """

        withdraw_ix = await self.make_withdraw_ix(amount)
        tx = Transaction().add(withdraw_ix)
        return await self._program.provider.send(tx)

    # --- Deactivate UTP

    async def make_deactivate_utp_ix(
        self, utp_index: UtpIndex
    ) -> TransactionInstruction:
        """
        [Internal] Create transaction instruction to deactivate the target UTP.

        :param utp_index: target UTP index
        :returns: transaction instruction
        """

        remaining_accounts = await self.get_observation_accounts()
        return make_deactivate_utp_ix(
            DeactivateUtpArgs(utp_index=utp_index.value),
            DeactivateUtpAccounts(
                marginfi_account=self.pubkey,
                authority=self._program.provider.wallet.public_key,
            ),
            self.client.program_id,
            remaining_accounts,
        )

    async def deactivate_utp(self, utp_index: UtpIndex) -> TransactionSignature:
        """
        [Internal] Deactivate the target UTP.

        :param utp_index target UTP index
        :returns: transaction signature
        """

        deactivate_ix = await self.make_deactivate_utp_ix(utp_index)
        tx = Transaction().add(deactivate_ix)
        return await self._program.provider.send(tx)

    async def make_handle_bankruptcy_ix(self):
        """
        Create transaction instruction to handle a bankrupt account.

        :returns: `HandleBankruptcy` transaction instruction
        """

        insurance_vault_authority_pk, _ = get_bank_authority(
            self._config.group_pk,
            self._program.program_id,
            BankVaultType.INSURANCE_VAULT,
        )
        remaining_accounts = await self.get_observation_accounts()

        return make_handle_bankruptcy_ix(
            HandleBankruptcyAccounts(
                marginfi_account=self.pubkey,
                marginfi_group=self.group.pubkey,
                insurance_vault=self.group.bank.insurance_vault,
                insurance_vault_authority=insurance_vault_authority_pk,
                liquidity_vault=self.group.bank.vault,
            ),
            self.client.program_id,
            remaining_accounts,
        )

    async def handle_bankruptcy(self):
        """
        Handle a bankrupt account.

        :returns: transaction signature
        """

        bankruptcy_ix = await self.make_handle_bankruptcy_ix()
        tx = Transaction().add(bankruptcy_ix)
        return await self._program.provider.send(tx)

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
            "Loading marginfi account %s, and group %s",
            self.pubkey,
            self._config.group_pk,
        )

        pubkeys = [self._config.group_pk, self.pubkey]
        response: RPCResponse = (
            await self._program.provider.connection.get_multiple_accounts(pubkeys)
        )
        if "error" in response.keys():
            raise Exception(f"Error while fetching {pubkeys}: {response['error']}")
        [marginfi_group_ai, marginfi_account_ai] = response["result"]["value"]
        if marginfi_group_ai is None:
            raise Exception(f"Marginfi group {self._config.group_pk} not found")
        if marginfi_account_ai is None:
            raise Exception(f"Marginfi account {self.pubkey} not found")

        return json_to_account_info(marginfi_group_ai), json_to_account_info(
            marginfi_account_ai
        )
