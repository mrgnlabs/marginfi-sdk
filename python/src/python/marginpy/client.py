"""This module contains the Provider class and associated utilities."""
from __future__ import annotations

from builtins import enumerate
from typing import TYPE_CHECKING, List, Tuple, Union

from anchorpy import AccountsCoder, Program, ProgramAccount, Provider, Wallet
from based58 import b58encode
from marginpy.account import MarginfiAccount
from marginpy.group import MarginfiGroup
from marginpy.instructions import (
    InitMarginfiAccountAccounts,
    make_init_marginfi_account_ix,
)
from marginpy.logger import get_logger
from marginpy.types import AccountType
from marginpy.utils.misc import load_idl
from solana.keypair import Keypair
from solana.publickey import PublicKey
from solana.rpc import types
from solana.rpc.async_api import AsyncClient
from solana.rpc.types import DataSliceOpts, MemcmpOpts
from solana.transaction import Transaction, TransactionSignature

if TYPE_CHECKING:
    from marginpy.config import MarginfiConfig


class MarginfiClient:
    """Entrypoint to interact with the marginfi contract."""

    _program: Program
    _config: "MarginfiConfig"
    _group: MarginfiGroup

    def __init__(
        self,
        config: "MarginfiConfig",
        program: Program,
        group: MarginfiGroup,
    ):
        """MarginfiClient constructor

        Args:
            config (MarginfiConfig): marginfi config
            program (Program): marginfi Anchor program
            group (MarginfiGroup): marginfi account group
        """
        self._config = config
        self._program = program
        self._group = group

    # --- Factories

    @classmethod
    async def fetch(
        cls,
        config: "MarginfiConfig",
        wallet: Wallet,
        rpc_client: AsyncClient,
        opts: types.TxOpts = None,
    ) -> MarginfiClient:
        """MarginfiClient factory

        Fetch account data according to the config and instantiate the corresponding MarginfiAccount.

        Args:
            config (MarginfiConfig): marginfi config
            wallet (Wallet): User wallet (used to pay fees and sign transations)
            rpc_client (AsyncClient): RPC client
            opts (types.TxOpts, optional): Transaction/commitment options. Defaults to DEFAULT_OPTIONS.

        Returns:
            MarginfiClient: client instance
        """

        logger = cls.get_logger()
        logger.debug(
            "Loading marginfi client\n\tprogram: %s\n\tenvironment: %s\n\tgroup: %s",
            config.program_id,
            config.environment,
            config.group_pk,
        )

        if opts is None:
            opts = config.tx_opts

        provider = Provider(rpc_client, wallet, opts)
        program = Program(load_idl(), config.program_id, provider=provider)
        group = await MarginfiGroup.fetch(config, program)
        return MarginfiClient(config, program, group)

    @staticmethod
    async def from_env():
        """MarginfiClient environment factory

        Fetch account data according to the ENV variables provided, and instantiate the corresponding MarginfiAccount.
        """

        # TODO

    # --- Getters and setters

    @property
    def program(self) -> Program:
        """marginfi Anchor program getter

        Returns:
            Program: marginfi Anchor program
        """

        return self._program

    @property
    def provider(self) -> Provider:
        """Anchor provider getter

        Returns:
            Program: Anchor provider
        """

        return self._program.provider

    @property
    def group(self) -> MarginfiGroup:
        """marginfi account group getter

        Returns:
            MarginfiGroup: marginfi account group
        """

        return self._group

    @property
    def config(self) -> "MarginfiConfig":
        """Client config getter

        Returns:
            MarginfiConfig: client config
        """

        return self._config

    @property
    def program_id(self) -> PublicKey:
        """marginfi program ID getter

        Returns:
            PublicKey: client config
        """

        return self._program.program_id

    # --- Others

    async def create_marginfi_account(
        self,
    ) -> Tuple[MarginfiAccount, TransactionSignature]:
        """Create a new marginfi account under the authority of the user.

        Returns:
            Tuple[MarginfiAccount, TransactionSignature]: newly created marginfi account
        """

        logger = self.get_logger()

        account_keypair = Keypair()
        account_pk = account_keypair.public_key
        logger.info("Creating Marginfi account %s", account_pk)

        create_marginfi_account_account_ix = await self._program.account[
            AccountType.MARGINFI_ACCOUNT.value
        ].create_instruction(account_keypair)
        init_marginfi_account_ix = make_init_marginfi_account_ix(
            InitMarginfiAccountAccounts(
                marginfi_group=self.group.pubkey,
                marginfi_account=account_pk,
                authority=self._program.provider.wallet.public_key,
            ),
            self.program_id,
        )
        tx = Transaction().add(
            create_marginfi_account_account_ix, init_marginfi_account_ix
        )
        sig = await self._program.provider.send(tx, signers=[account_keypair])
        await self._program.provider.connection.confirm_transaction(sig)
        account = await MarginfiAccount.fetch(account_pk, self)
        return account, sig

    async def get_own_marginfi_accounts(self) -> List[MarginfiAccount]:
        """Retrieve all marginfi accounts under the authority of the user.

        Returns:
            List[MarginfiAccount]: marginfi account instances
        """

        marginfi_group = await MarginfiGroup.fetch(self._config, self._program)
        all_accounts = await self._program.account["MarginfiAccount"].all(
            memcmp_opts=[
                # authority is the first field in the account, so only offset is the discriminant
                MemcmpOpts(
                    bytes=self._program.provider.wallet.public_key.to_base58().decode(
                        "utf-8"
                    ),
                    offset=8,
                ),
                # marginfiGroup is the second field in the account after the authority,
                # so offset by the discriminant and a pubkey
                MemcmpOpts(
                    bytes=self._group.pubkey.to_base58().decode("utf-8"), offset=8 + 32
                ),
            ]
        )

        def convert(program_account: ProgramAccount):
            return MarginfiAccount.from_account_data(
                program_account.public_key, self, program_account.account, marginfi_group  # type: ignore
            )

        own_accounts = map(convert, all_accounts)
        return list(own_accounts)

    async def get_all_marginfi_account_addresses(self) -> List[PublicKey]:
        """Retrieve the addresses of all marginfi accounts in the udnerlying group.

        Raises:
            Exception: when RPC call errors out

        Returns:
            List[PublicKey]: marginfi account addresses
        """

        coder = AccountsCoder(load_idl())
        discriminator: bytes = coder.acc_name_to_discriminator[
            AccountType.MARGINFI_ACCOUNT.value
        ]
        rpc_response = await self._program.provider.connection.get_program_accounts(
            self.program_id,
            encoding="base64",
            commitment=self._program.provider.connection.commitment,
            data_slice=DataSliceOpts(offset=0, length=0),
            memcmp_opts=[
                MemcmpOpts(
                    bytes=self._group.pubkey.to_base58().decode("utf-8"), offset=8 + 32
                ),
                MemcmpOpts(offset=0, bytes=b58encode(discriminator).decode("ascii")),
            ],
        )
        if "error" in rpc_response.keys():
            raise Exception(
                "Error while fetching marginfi accounts addresses:"
                f" {rpc_response['error']}"
            )
        accounts = rpc_response["result"]
        return [a["pubkey"] for a in accounts if a is not None]

    async def get_all_marginfi_accounts(self) -> List[MarginfiAccount]:
        """Retrieve all marginfi accounts in the underlying group

        Returns:
            List[MarginfiAccount]: marginfi accounts
        """

        marginfi_group = await MarginfiGroup.fetch(self._config, self._program)
        marginfi_account_addresses = await self.get_all_marginfi_account_addresses()
        fetch_results = await self._program.account[
            AccountType.MARGINFI_ACCOUNT.value
        ].fetch_multiple(marginfi_account_addresses)
        all_accounts = []
        for i, account_data in enumerate(fetch_results):
            if account_data is None:
                continue
            all_accounts.append(
                MarginfiAccount.from_account_data(
                    marginfi_account_addresses[i],
                    self,
                    account_data,  # type: ignore
                    marginfi_group,
                )
            )
        return all_accounts

    async def get_marginfi_account(
        self, address: Union[str, PublicKey]
    ) -> MarginfiAccount:
        """Retrieve specified marginfi account

        Args:
            address (PublicKey): marginfi account address

        Returns:
            MarginfiAccount: marginfi account
        """
        if isinstance(address, str):
            return await MarginfiAccount.fetch(PublicKey(address), self)

        return await MarginfiAccount.fetch(address, self)

    async def get_all_program_account_addresses(
        self, account_type: AccountType
    ) -> List[PublicKey]:
        """Retrieve the addresses of all accounts of the spcified type, owned by the marginfi program

        Args:
            account_type (AccountType): account type

        Raises:
            Exception: when RPC call errors out

        Returns:
            List[PublicKey]: account addresses
        """

        coder = AccountsCoder(load_idl())
        discriminator: bytes = coder.acc_name_to_discriminator[account_type.value]
        rpc_response = await self._program.provider.connection.get_program_accounts(
            self.program_id,
            encoding="base64",
            commitment=self._program.provider.connection.commitment,
            data_slice=DataSliceOpts(offset=0, length=0),
            memcmp_opts=[
                MemcmpOpts(
                    bytes=self._group.pubkey.to_base58().decode("utf-8"), offset=8 + 32
                ),
                MemcmpOpts(offset=0, bytes=b58encode(discriminator).decode("ascii")),
            ],
        )
        if "error" in rpc_response.keys():
            raise Exception(
                "Error while fetching marginfi accounts addresses:"
                f" {rpc_response['error']}"
            )
        accounts = rpc_response["result"]
        return [a["pubkey"] for a in accounts if a is not None]

    async def terminate(self) -> None:
        """Cleanup connections"""

        await self._program.close()

    @staticmethod
    def get_logger():
        return get_logger(f"{__name__}.MarginfiClient")
