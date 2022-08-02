from math import inf
from typing import TYPE_CHECKING, List, Tuple

from anchorpy import AccountsCoder, Program
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
from marginpy.logger import get_logger
from marginpy.types import (
    UTP_NAME,
    AccountBalances,
    BankVaultType,
    EquityType,
    MarginRequirementType,
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
    """Entrypoint to interact with the marginfi contract."""

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
        """[Internal] Constructor

        Args:
            marginfi_account_pk (PublicKey): address of the marginfi account
            authority (PublicKey): marginfi account authority
            client (MarginfiClient): marginfi client
            group (MarginfiGroup): parent marginfi group
            deposit_record (float): marginfi account deposit record
            borrow_record (float): marginfi account borrow record
            mango_utp_data (UtpData): Mango-specific data
            zo_utp_data (UtpData): 01-specific data
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

    @classmethod
    async def fetch(
        cls, marginfi_account_pk: PublicKey, client: "MarginfiClient"
    ) -> "MarginfiAccount":
        """MarginfiAccount network factory.
        Fetch account data according to the config and instantiate the corresponding MarginfiAccount.

        Args:
            marginfi_account_pk (PublicKey): address of the target account
            client (MarginfiClient): marginfi client

        Returns:
            MarginfiAccount: marginfi account
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
        """MarginfiAccount local factory (decoded)

        Instantiate a MarginfiAccount according to the provided decoded data.
        Check sanity against provided config.

        Args:
            marginfi_account_pk (PublicKey): address of the target account
            client (MarginfiClient): marginfi client
            account_data (MarginfiAccountData): decoded marginfi account data
            marginfi_group (MarginfiGroup): marginfi group instance

        Raises:
            Exception: mismatch between the group that expected and the one decoded from the account data

        Returns:
            MarginfiAccount: marginfi account
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
        """MarginfiAccount local factory (encoded)

        Instantiate a MarginfiGroup according to the provided encoded data.
        Check sanity against provided config.

        Args:
            marginfi_account_pk (PublicKey): address of the target account
            client (MarginfiClient): marginfi client
            data (bytes): decoded marginfi account data
            marginfi_group (MarginfiGroup): marginfi group instance

        Returns:
            MarginfiAccount: marginfi account
        """

        marginfi_account_data = MarginfiAccount.decode(data)
        account = MarginfiAccount.from_account_data(
            marginfi_account_pk, client, marginfi_account_data, marginfi_group
        )

        return account

    # --- Getters / Setters

    @property
    def pubkey(self) -> PublicKey:
        """Get marginfi account address

        Returns:
            PublicKey: marginfi account address
        """

        return self._pubkey

    @property
    def group(self) -> "MarginfiGroup":
        """Get parent marginfi group

        Returns:
            MarginfiGroup: Parent marginfi group
        """

        return self._group

    @property
    def client(self) -> "MarginfiClient":
        """Get marginfi client

        Returns:
            MarginfiClient: marginfi client
        """

        return self._client

    @property
    def observation_cache(self) -> dict[UtpIndex, UtpObservation]:
        """Get observation cache

        Returns:
            dict[UtpIndex, UtpObservation]: Observation cache
        """

        return self._observation_cache

    @property
    def authority(self) -> PublicKey:
        """Get marginfi account authority address

        Returns:
            PublicKey: marginfi account authority address
        """

        return self._authority

    @property
    def all_utps(self) -> List[UtpAccount]:
        """Get list of supported UTP proxies"""

        return [self.mango, self.zo]

    @property
    def active_utps(self) -> List[UtpAccount]:
        """Get list of active UTP proxies

        Returns:
            List[UtpAccount]: _description_
        """

        filtered = filter(lambda x: x.is_active, self.all_utps)
        return list(filtered)

    @property
    def deposits(self) -> float:
        """Get current GMA deposits

        Returns:
            float: current GMA deposits
        """

        return self.group.bank.compute_native_amount(self._deposit_record, Deposit())

    @property
    def borrows(self) -> float:
        """Get current GMA borrows

        Returns:
            float: current GMA borrows
        """

        return self.group.bank.compute_native_amount(self._borrow_record, Borrow())

    # --- Getters / Setters (internal)

    @property
    def _program(self) -> Program:
        """[Internal] Get marginfi Anchor program

        Returns:
            Program: marginfi Anchor program
        """

        return self.client.program

    @property
    def _config(self) -> "MarginfiConfig":
        """[Internal] Get marginfi client config

        Returns:
            MarginfiConfig: marginfi client config
        """

        return self.client.config

    # --- Others

    @staticmethod
    async def _fetch_account_data(
        marginfi_account_pk: PublicKey,
        config: "MarginfiConfig",
        rpc_client: AsyncClient,
    ) -> "MarginfiAccountData":
        """[Internal] MarginfiAccount local factory (encoded)

        Fetch marginfi account data.
        Check sanity against provided config.

        Args:
            marginfi_account_pk (PublicKey): address of the target account
            config (MarginfiConfig): client config
            rpc_client (AsyncClient): RPC client

        Raises:
            Exception: account not found
            Exception: mismatch between the group that expected and the one decoded from the account data

        Returns:
            MarginfiAccountData: marginfi account
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

        return data

    @staticmethod
    def _pack_utp_data(data: MarginfiAccountData, utp_index: UtpIndex) -> UtpData:
        """[Internal] Pack data from the on-chain, vector format into a coherent unit.

        Args:
            data (MarginfiAccountData): marginfi account data
            utp_index (UtpIndex): index of the target UTP

        Returns:
            UtpData: packed UTP data
        """
        return UtpData(
            account_config=data.utp_account_config[utp_index],
            is_active=data.active_utps[utp_index],
        )

    @staticmethod
    def decode(encoded: bytes) -> MarginfiAccountData:
        """Decode marginfi account data according to the Anchor IDL.

        Args:
            encoded (bytes): raw data buffer

        Returns:
            MarginfiAccountData: decoded marginfi account data struct
        """

        return MarginfiAccountData.decode(encoded)

    @staticmethod
    async def encode(decoded: MarginfiAccountData) -> bytes:
        """Encode marginfi account data according to the Anchor IDL.

        Args:
            decoded (MarginfiAccountData): decoded marginfi account data struct

        Returns:
            bytes: raw data buffer
        """

        coder = AccountsCoder(load_idl())
        return coder.build(decoded)

    async def reload(self, observe_utps=False) -> None:
        """Update instance data by fetching and storing the latest on-chain state.

        Args:
            observe_utps (bool, optional): flag to request UTP observation as well. Defaults to False.

        Raises:
            Exception: mismatch between the group that expected and the one decoded from the account data
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
        """Update instance data from provided data struct.

        Args:
            data (MarginfiAccountData): marginfi account data struct
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
        """Get all account metas required for the observation of active UTPs

        Returns:
            List[AccountMeta]: observation accounts
        """

        logger = self.get_logger()

        accounts = []
        for utp in self.active_utps:
            accounts.extend(await utp.get_observation_accounts())
        logger.debug("Loading %s observation accounts", len(accounts))
        return accounts

    # --- Deposit to GMA

    async def make_deposit_ix(self, amount: float) -> TransactionInstruction:
        """Create transaction instruction to deposit collateral into the marginfi account.

        Args:
            amount (float): amount to deposit (UI unit)

        Returns:
            TransactionInstruction: transaction instruction
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
        """Deposit collateral into the marginfi account.

        Args:
            amount (float): amount to deposit (UI unit)

        Returns:
            TransactionSignature: transaction signature
        """

        logger = self.get_logger()
        logger.debug("Depositing %s into marginfi account", amount)

        deposit_ix = await self.make_deposit_ix(amount)
        tx = Transaction().add(deposit_ix)
        sig = await self._program.provider.send(tx)
        logger.debug("Deposit successful: %s", sig)
        return sig

    # --- Withdraw from GMA

    async def make_withdraw_ix(self, amount: float) -> TransactionInstruction:
        """Create transaction instruction to withdraw collateral from the marginfi account.

        Args:
            amount (float): amount to withdraw (mint native unit)

        Returns:
            TransactionInstruction: transaction instruction
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
        """Withdraw collateral from the marginfi account.

        Args:
            amount (float): amount to withdraw (mint native unit)

        Returns:
            TransactionSignature: transaction signature
        """

        logger = self.get_logger()
        logger.debug("Withdrawing %s into marginfi account", amount)

        withdraw_ix = await self.make_withdraw_ix(amount)
        tx = Transaction().add(withdraw_ix)
        sig = await self._program.provider.send(tx)
        logger.debug("Withdrawal successful: %s", sig)
        return sig

    # --- Deactivate UTP

    async def make_deactivate_utp_ix(
        self, utp_index: UtpIndex
    ) -> TransactionInstruction:
        """[Internal] Create transaction instruction to deactivate the target UTP.

        Args:
            utp_index (UtpIndex): target UTP index

        Returns:
            TransactionInstruction: transaction instruction
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
        """[Internal] Deactivate the target UTP.

        Args:
            utp_index (UtpIndex): target UTP index

        Returns:
            TransactionSignature: transaction signature
        """

        logger = self.get_logger()
        logger.debug("Deactivating UTP %s into marginfi account", utp_index)

        deactivate_ix = await self.make_deactivate_utp_ix(utp_index)
        tx = Transaction().add(deactivate_ix)
        sig = await self._program.provider.send(tx)
        logger.debug("Deactivation successful: %s", sig)
        return sig

    async def make_handle_bankruptcy_ix(self) -> TransactionInstruction:
        """Create transaction instruction to handle a bankrupt account.

        Returns:
            TransactionInstruction: transaction instruction
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

    async def handle_bankruptcy(self) -> TransactionSignature:
        """Handle a bankrupt account.

        Returns:
            TransactionInstruction: transaction signature
        """

        logger = self.get_logger()
        logger.debug("Handling bankruptcy")

        bankruptcy_ix = await self.make_handle_bankruptcy_ix()
        tx = Transaction().add(bankruptcy_ix)
        sig = await self._program.provider.send(tx)
        logger.debug("Handling successful: %s", sig)
        return sig

    async def observe_utps(self) -> dict[UtpIndex, UtpObservation]:
        """Observe all active UTPs and cache the result.

        Returns:
            dict[UtpIndex, UtpObservation]: observation cache
        """

        logger = self.get_logger()
        logger.debug("Observing UTP accounts")

        observation_cache = {utp.index: await utp.observe() for utp in self.active_utps}
        self._observation_cache = observation_cache
        return observation_cache

    async def load_group_and_account_ai(self) -> Tuple[AccountInfo, AccountInfo]:
        """Atomically load underlying marginfi group and account

        Raises:
            Exception: RPC call errors out
            Exception: group not found
            Exception: account not found

        Returns:
            Tuple[AccountInfo, AccountInfo]: account infos for marginfi group and account
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
            logger.critical("Error while fetching %s: %s", pubkeys, response["error"])
            raise Exception(f"Error while fetching {pubkeys}: {response['error']}")
        [marginfi_group_ai, marginfi_account_ai] = response["result"]["value"]
        if marginfi_group_ai is None:
            logger.critical("Marginfi group %s not found", self._config.group_pk)
            raise Exception(f"Marginfi group {self._config.group_pk} not found")
        if marginfi_account_ai is None:
            logger.critical("Marginfi account %s not found", self.pubkey)
            raise Exception(f"Marginfi account {self.pubkey} not found")

        return json_to_account_info(marginfi_group_ai), json_to_account_info(
            marginfi_account_ai
        )

    def compute_balances(
        self, equity_type: EquityType = EquityType.INIT_REQ_ADJUSTED
    ) -> AccountBalances:
        """Compute account balances

        Args:
            equity_type (EquityType, optional): equity type to account for. Defaults to EquityType.InitReqAdjusted.

        Returns:
            AccountBalances: account balances
        """

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

    def compute_margin_requirement(self, mreq_type: MarginRequirementType) -> float:
        """Compute account margin requirement

        Args:
            mreq_type (MarginRequirementType): margin requirement type to compute

        Returns:
            float: margin requirement
        """

        return self.borrows * self.group.bank.margin_ratio(mreq_type)

    def __repr__(self):
        balances = self.compute_balances()
        margin_ratio = (
            balances.equity / balances.liabilities if balances.liabilities > 0 else inf
        )

        init_req = self.compute_margin_requirement(MarginRequirementType.INITIAL)
        maint_req = self.compute_margin_requirement(MarginRequirementType.MAINTENANCE)
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
