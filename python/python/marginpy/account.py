from math import inf
from typing import TYPE_CHECKING, List, Tuple

from anchorpy import AccountsCoder, Program
from marginpy.constants import COLLATERAL_SCALING_FACTOR
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
from marginpy.logger import get_logger
from marginpy.types import (
    UTP_NAME,
    AccountBalances,
    BankVaultType,
    EquityType,
    InstructionsWrapper,
    LendingSide,
    MarginfiAccountData,
    MarginRequirement,
    UtpData,
    UtpIndex,
)
from marginpy.utils.data_conversion import (
    b64str_to_bytes,
    json_to_account_info,
    ui_to_native,
    wrapped_fixed_to_float,
)
from marginpy.utils.misc import load_idl
from marginpy.utils.pda import get_bank_authority
from marginpy.utp.account import UtpAccount
from marginpy.utp.mango import UtpMangoAccount
from marginpy.utp.observation import UtpObservation
from marginpy.utp.zo import UtpZoAccount
from solana.publickey import PublicKey
from solana.rpc.async_api import AsyncClient
from solana.rpc.responses import AccountInfo
from solana.rpc.types import RPCResponse
from solana.transaction import AccountMeta, Transaction, TransactionSignature
from spl.token.instructions import get_associated_token_address

if TYPE_CHECKING:
    from marginpy.client import MarginfiClient
    from marginpy.config import MarginfiConfig


class MarginfiAccount:
    """
    Entrypoint to interact with the marginfi contract.
    """

    _pubkey: PublicKey
    _group: MarginfiGroup
    _observation_cache: dict[UtpIndex, UtpObservation]
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
        mango_utp_data: UtpData,
        zo_utp_data: UtpData,
    ) -> None:
        self._pubkey = marginfi_account_pk
        self._client = client
        self._authority = authority
        self._group = group

        self.mango = UtpMangoAccount(client, self, mango_utp_data)
        self.zo = UtpZoAccount(client, self, zo_utp_data)

        self._deposit_record = deposit_record
        self._borrow_record = borrow_record

        # --- Factories

    @classmethod
    async def fetch(
        cls, marginfi_account_pk: PublicKey, client: "MarginfiClient"
    ) -> "MarginfiAccount":
        """
        MarginfiAccount network factory.

        Fetches account data according to the config and instantiate the corresponding MarginfiAccount.
        """

        logger = get_logger(f"{__name__}.MarginfiAccount")
        logger.debug("Loading marginfi account %s", marginfi_account_pk)

        account_data = await MarginfiAccount._fetch_account_data(
            marginfi_account_pk, client.config, client.program.provider.connection
        )

        account = MarginfiAccount(
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

        logger.info("marginfi account loaded:\n%s", account)

        return account

    @staticmethod
    def from_account_data(
        marginfi_account_pk: PublicKey,
        client: "MarginfiClient",
        account_data: MarginfiAccountData,
        marginfi_group: MarginfiGroup,
    ) -> "MarginfiAccount":
        """
        MarginfiAccount local factory (decoded).

        Instantiates a MarginfiAccount according to the provided decoded data.
        Check sanity against provided config.
        """

        if not account_data.marginfi_group == client.config.group_pk:
            raise Exception(
                f"Marginfi account tied to group {account_data.marginfi_group}."
                f" Expected: {client.config.group_pk}"
            )

        account = MarginfiAccount(
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

        return account

    @staticmethod
    def from_account_data_raw(
        marginfi_account_pk: PublicKey,
        client: "MarginfiClient",
        data: bytes,
        marginfi_group: MarginfiGroup,
    ) -> "MarginfiAccount":
        """
        MarginfiAccount local factory (encoded).

        Instantiates a MarginfiGroup according to the provided encoded data.
        Check sanity against provided config.
        """

        marginfi_account_data = MarginfiAccount.decode(data)
        account = MarginfiAccount.from_account_data(
            marginfi_account_pk, client, marginfi_account_data, marginfi_group
        )

        return account

    # --- Getters / Setters

    @property
    def pubkey(self) -> PublicKey:
        return self._pubkey

    @property
    def group(self) -> "MarginfiGroup":
        return self._group

    @property
    def client(self) -> "MarginfiClient":
        return self._client

    @property
    def observation_cache(self) -> dict[UtpIndex, UtpObservation]:
        return self._observation_cache

    @property
    def authority(self) -> PublicKey:
        return self._authority

    @property
    def all_utps(self) -> List[UtpAccount]:
        return [self.mango, self.zo]

    @property
    def active_utps(self) -> List[UtpAccount]:
        filtered = filter(lambda x: x.is_active, self.all_utps)
        return list(filtered)

    @property
    def deposits(self) -> float:
        return self.group.bank.compute_native_amount(
            self._deposit_record, LendingSide.DEPOSIT
        )

    @property
    def borrows(self) -> float:
        return self.group.bank.compute_native_amount(
            self._borrow_record, LendingSide.BORROW
        )

    # --- Getters / Setters (internal)

    @property
    def _program(self) -> Program:
        return self.client.program

    @property
    def _config(self) -> "MarginfiConfig":
        return self.client.config

    # --- Others

    @staticmethod
    async def _fetch_account_data(
        marginfi_account_pk: PublicKey,
        config: "MarginfiConfig",
        rpc_client: AsyncClient,
    ) -> "MarginfiAccountData":
        """
        [internal] MarginfiAccount local factory (encoded).

        Fetches marginfi account data.
        Checks sanity against provided config.

        Raises:
            Exception: account not found
            Exception: mismatch between the expected group address and the one decoded from the account data
        """

        logger = get_logger(f"{__name__}.MarginfiAccount")
        logger.debug(
            "Fetching account data for marginfi account %s",
            marginfi_account_pk,
        )

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

        logger.debug("Fetched: %s", data)

        return data  # type: ignore

    @staticmethod
    def _pack_utp_data(data: MarginfiAccountData, utp_index: UtpIndex) -> UtpData:
        """
        [internal] Packs data from the on-chain, vector format into a coherent unit.

        Args:
            data (MarginfiAccountData): marginfi account data
            utp_index (UtpIndex): index of the target UTP
        """
        return UtpData(
            account_config=data.utp_account_config[utp_index],
            is_active=data.active_utps[utp_index],
        )

    @staticmethod
    def decode(encoded: bytes) -> MarginfiAccountData:
        """
        Decodes marginfi account data according to the Anchor IDL.
        """

        return MarginfiAccountData.decode(encoded)  # type: ignore

    @staticmethod
    async def encode(decoded: MarginfiAccountData) -> bytes:
        """
        Encodes marginfi account data according to the Anchor IDL.
        """

        coder = AccountsCoder(load_idl())
        return coder.build(decoded)

    async def reload(self, observe_utps=False) -> None:
        """
        Updates instance data by fetching and storing the latest on-chain state.

        Args:
            observe_utps (bool, optional): flag to request UTP observation as well. Defaults to False.

        Raises:
            Exception: mismatch between the expected group address and the one decoded from the account data
        """

        logger = self.get_logger()
        logger.debug("Reloading account data for %s", self.pubkey)

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
            await self.observe_utps()

    def _update_from_account_data(self, data: MarginfiAccountData) -> None:
        self._authority = data.authority
        self._deposit_record = (
            wrapped_fixed_to_float(data.deposit_record) / COLLATERAL_SCALING_FACTOR
        )
        self._borrow_record = (
            wrapped_fixed_to_float(data.borrow_record) / COLLATERAL_SCALING_FACTOR
        )

        self.mango._update(  # pylint: disable=protected-access
            self._pack_utp_data(  # pylint: disable=protected-access
                data, UtpIndex.MANGO
            )
        )
        self.zo._update(  # pylint: disable=protected-access
            self._pack_utp_data(data, UtpIndex.ZO)  # pylint: disable=protected-access
        )

    # --- Deposit to GMA

    async def make_deposit_ix(self, ui_amount: float) -> InstructionsWrapper:
        user_ata = get_associated_token_address(
            self._program.provider.wallet.public_key, self.group.bank.mint
        )
        remaining_accounts = await self.get_observation_accounts()
        ix = make_deposit_ix(
            DepositArgs(amount=ui_to_native(ui_amount)),
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
        return InstructionsWrapper(instructions=[ix], signers=[])

    async def deposit(self, ui_amount: float) -> TransactionSignature:
        logger = self.get_logger()
        logger.debug("Depositing %s into marginfi account", ui_amount)

        ix = await self.make_deposit_ix(ui_amount)
        tx = Transaction().add(*ix.instructions)
        sig = await self._program.provider.send(tx)
        logger.debug("Deposit successful: %s", sig)
        return sig

    # --- Withdraw from GMA

    async def make_withdraw_ix(self, ui_amount: float) -> InstructionsWrapper:
        user_ata = get_associated_token_address(
            self._program.provider.wallet.public_key, self.group.bank.mint
        )
        margin_bank_authority_pk, _ = get_bank_authority(
            self._config.group_pk, self._program.program_id
        )
        remaining_accounts = await self.get_observation_accounts()

        ix = make_withdraw_ix(
            WithdrawArgs(amount=ui_to_native(ui_amount)),
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
        return InstructionsWrapper(instructions=[ix], signers=[])

    async def withdraw(self, ui_amount: float) -> TransactionSignature:
        logger = self.get_logger()
        logger.debug("Withdrawing %s into marginfi account", ui_amount)

        ix = await self.make_withdraw_ix(ui_amount)
        tx = Transaction().add(*ix.instructions)
        sig = await self._program.provider.send(tx)
        logger.debug("Withdrawal successful: %s", sig)
        return sig

    # --- Deactivate UTP

    async def _make_deactivate_utp_ix(self, utp_index: UtpIndex) -> InstructionsWrapper:
        ix = make_deactivate_utp_ix(
            DeactivateUtpArgs(utp_index=utp_index.value),
            DeactivateUtpAccounts(
                marginfi_account=self.pubkey,
                authority=self._program.provider.wallet.public_key,
            ),
            self.client.program_id,
            remaining_accounts=await self.get_observation_accounts(),
        )
        return InstructionsWrapper(
            instructions=[ix],
            signers=[],
        )

    async def _deactivate_utp(self, utp_index: UtpIndex) -> TransactionSignature:
        logger = self.get_logger()
        logger.debug("Deactivating UTP %s into marginfi account", utp_index)

        ix = await self._make_deactivate_utp_ix(utp_index)
        tx = Transaction().add(*ix.instructions)
        sig = await self._program.provider.send(tx)
        logger.debug("Deactivation successful: %s", sig)
        return sig

    async def make_handle_bankruptcy_ix(self) -> InstructionsWrapper:
        insurance_vault_authority_pk, _ = get_bank_authority(
            self._config.group_pk,
            self._program.program_id,
            BankVaultType.INSURANCE_VAULT,
        )
        remaining_accounts = await self.get_observation_accounts()

        ix = make_handle_bankruptcy_ix(
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
        return InstructionsWrapper(
            instructions=[ix],
            signers=[],
        )

    async def handle_bankruptcy(self) -> TransactionSignature:
        logger = self.get_logger()
        logger.debug("Handling bankruptcy")

        ix = await self.make_handle_bankruptcy_ix()
        tx = Transaction().add(*ix.instructions)
        sig = await self._program.provider.send(tx)
        logger.debug("Handling successful: %s", sig)
        return sig

    async def get_observation_accounts(self) -> List[AccountMeta]:
        """
        Gets all account metas required for the observation of active UTPs.
        """

        logger = self.get_logger()

        accounts = []
        for utp in self.active_utps:
            accounts.extend(await utp.get_observation_accounts())
        logger.debug("Loading %s observation accounts", len(accounts))
        return accounts

    async def observe_utps(self) -> dict[UtpIndex, UtpObservation]:
        """
        Observes all active UTPs and cache the result.
        """

        logger = self.get_logger()
        logger.debug("Observing UTP accounts")

        observation_cache = {utp.index: await utp.observe() for utp in self.active_utps}
        self._observation_cache = observation_cache
        return observation_cache

    async def load_group_and_account_ai(self) -> Tuple[AccountInfo, AccountInfo]:
        """
        Atomically loads underlying marginfi group and account.

        Raises:
            Exception: RPC call errors out
            Exception: group not found
            Exception: account not found

        Returns:
            Tuple[AccountInfo, AccountInfo]: ordered account infos for marginfi group and account
        """

        logger = self.get_logger()
        logger.debug(
            "Loading marginfi account %s, and group %s",
            self.pubkey,
            self._config.group_pk,
        )

        pubkeys = [self._config.group_pk, self.pubkey]
        response: RPCResponse = await self._program.provider.connection.get_multiple_accounts(
            pubkeys  # type: ignore
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

    def compute_balances(
        self, equity_type: EquityType = EquityType.INIT_REQ_ADJUSTED
    ) -> AccountBalances:
        assets = self.deposits
        for utp in self.active_utps:
            assets += (
                utp.free_collateral
                if equity_type == EquityType.INIT_REQ_ADJUSTED
                else utp.equity
            )
        liabilities = self.borrows
        equity = assets - liabilities

        return AccountBalances(equity=equity, assets=assets, liabilities=liabilities)

    def compute_margin_requirement(self, mreq_type: MarginRequirement) -> float:
        return self.borrows * self.group.bank.compute_margin_ratio(mreq_type)

    def __repr__(self):
        balances = self.compute_balances()
        margin_ratio = (
            balances.equity / balances.liabilities if balances.liabilities > 0 else inf
        )

        init_req = self.compute_margin_requirement(MarginRequirement.INITIAL)
        maint_req = self.compute_margin_requirement(MarginRequirement.MAINTENANCE)
        init_health = balances.equity / init_req if init_req > 0 else inf
        maint_health = balances.equity / maint_req if maint_req > 0 else inf

        buffer = f"""-----------------
Marginfi account:
  Address: {self.pubkey}
  GA Balance: {self.deposits}
  Equity: {balances.equity},
  Assets: {balances.assets},
  Liabilities: {balances.liabilities}
  Margin ratio: {margin_ratio}
  Requirement
    init: {init_req}, health: {init_health}
    maint: {maint_req}, health: {maint_health}"""

        if len(self.active_utps) > 0:
            buffer += "\n-----------------\nUTPs:"

        for utp in self.active_utps:
            buffer += f"""\n  {UTP_NAME[utp.index]}:
    Address: {utp.address}
    Equity: {utp.equity},
    Free collateral: {utp.free_collateral}"""

        return buffer

    def get_logger(self):
        return get_logger(f"{__name__}.MarginfiAccount.{self.pubkey}")
