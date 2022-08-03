"""This module contains the Provider class and associated utilities."""
from __future__ import annotations

import json
import os
from builtins import enumerate
from typing import Any, Dict, List, Literal, Tuple, Union

from anchorpy import AccountsCoder, Program, ProgramAccount, Provider, Wallet
from based58 import b58encode
from marginpy.account import MarginfiAccount
from marginpy.config import MarginfiConfig
from marginpy.group import MarginfiGroup
from marginpy.instructions import (
    InitMarginfiAccountAccounts,
    make_init_marginfi_account_ix,
)
from marginpy.logger import get_logger
from marginpy.types import AccountType, Environment
from marginpy.utils.misc import handle_override, load_idl
from solana.keypair import Keypair
from solana.publickey import PublicKey
from solana.rpc import types
from solana.rpc.async_api import AsyncClient
from solana.rpc.types import DataSliceOpts, MemcmpOpts
from solana.transaction import Transaction, TransactionSignature


class MarginfiClient:
    """
    Entrypoint to interact with the marginfi contract.
    """

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
        """
        MarginfiClient factory.

        Fetches account data according to the config and instantiate the corresponding MarginfiAccount.

        Args:
            config (MarginfiConfig): marginfi config
            wallet (Wallet): User wallet (used to pay fees and sign transations)
            rpc_client (AsyncClient): RPC client
            opts (types.TxOpts, optional): Transaction/commitment options. Defaults to DEFAULT_OPTIONS.

        Returns:
            MarginfiClient: marginfi client
        """

        logger = cls._get_logger()
        logger.debug(
            "Loading marginfi client:\n\tprogram: %s\n\tenvironment: %s\n\tgroup: %s",
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

    @classmethod
    async def from_env(
        cls,
        overrides: Dict[
            Literal["env", "connection", "program_id", "group_pk"], Any
        ] = None,
    ) -> MarginfiClient:
        """
        MarginfiClient environment factory.

        Fetches account data according to the ENV variables provided, and instantiate the corresponding MarginfiAccount.

        Args:
            overrides (Dict[str, Any], optional): override to environment variables. Defaults to {}.

        Returns:
            MarginfiClient: marginfi client
        """

        if overrides is None:
            overrides = {}

        logger = cls._get_logger()

        env = handle_override("env", Environment[os.getenv("ENV") or ""], overrides)
        config = MarginfiConfig(env)
        rpc_client = handle_override(
            "connection",
            AsyncClient(os.getenv("RPC_ENDPOINT"), config.tx_opts.preflight_commitment),
            overrides,
        )
        program_id = handle_override(
            "program_id", PublicKey(os.getenv("MARGINFI_PROGRAM") or ""), overrides
        )
        group_pk = handle_override(
            "group_pk", PublicKey(os.getenv("MARGINFI_GROUP") or ""), overrides
        )

        if "WALLET_KEY" in os.environ:
            wallet_keypair = Keypair.from_secret_key(
                json.loads(os.getenv("WALLET_KEY") or "")
            )
        else:
            with open(
                os.path.expanduser(os.getenv("WALLET") or ""), "r", encoding="utf-8"
            ) as fyle:
                wallet_keypair = Keypair.from_secret_key(json.load(fyle))
        wallet = Wallet(wallet_keypair)

        config = MarginfiConfig(
            env, overrides={"group_pk": group_pk, "program_id": program_id}
        )

        logger.debug(
            "Loading the marginfi client from env vars\n\tEnv: %s\n\tProgram:"
            " %s\n\tGroup: %s\n\tAuthority: %s",
            env,
            program_id,
            group_pk,
            wallet.public_key,
        )

        return await MarginfiClient.fetch(config, wallet, rpc_client)

    # --- Getters and setters

    @property
    def program(self) -> Program:
        return self._program

    @property
    def provider(self) -> Provider:
        return self._program.provider

    @property
    def group(self) -> MarginfiGroup:
        return self._group

    @property
    def config(self) -> "MarginfiConfig":
        return self._config

    @property
    def program_id(self) -> PublicKey:
        return self._program.program_id

    # --- Others

    async def create_marginfi_account(
        self,
    ) -> Tuple[MarginfiAccount, TransactionSignature]:
        """
        Creates a new marginfi account under the authority of the user.

        Returns:
            Tuple[MarginfiAccount, TransactionSignature]: new marginfi account and creation tx signature
        """

        logger = self._get_logger()

        account_keypair = Keypair()
        account_pk = account_keypair.public_key
        logger.debug("Creating marginfi account %s", account_pk)

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
        logger.info("marginfi account created:\n%s", account)
        return account, sig

    async def load_own_marginfi_accounts(self) -> List[MarginfiAccount]:
        """
        Retrieves all marginfi accounts under the authority of the user.
        """

        logger = self._get_logger()
        logger.debug(
            "Loading marginfi accounts under user %s", self.provider.wallet.public_key
        )

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

    async def load_all_marginfi_account_addresses(self) -> List[PublicKey]:
        """
        Retrieves the addresses of all marginfi accounts in the underlying group.

        Raises:
            Exception: RPC call errors out
        """

        logger = self._get_logger()
        logger.debug(
            "Loading all marginfi account addresses in group %s", self.group.pubkey
        )

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

    async def load_all_marginfi_accounts(self) -> List[MarginfiAccount]:
        """
        Retrieves all marginfi accounts in the underlying group.
        """

        logger = self._get_logger()
        logger.debug("Loading all marginfi accounts in group %s", self.group.pubkey)

        marginfi_group = await MarginfiGroup.fetch(self._config, self._program)
        marginfi_account_addresses = await self.load_all_marginfi_account_addresses()
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

    async def load_marginfi_account(
        self, address: Union[str, PublicKey]
    ) -> MarginfiAccount:
        """
        Retrieves specified marginfi account.
        """

        logger = self._get_logger()
        logger.debug("Loading marginfi account %s", address)

        pubkey = PublicKey(address) if isinstance(address, str) else address
        account = await MarginfiAccount.fetch(pubkey, self)
        logger.info("marginfi account loaded:\n%s", account)
        return account

    async def load_all_program_account_addresses(
        self, account_type: AccountType
    ) -> List[PublicKey]:
        """
        Retrieves the addresses of all accounts of the spcified type, owned by the marginfi program.

        Raises:
            Exception: RPC call errors out
        """

        logger = self._get_logger()
        logger.debug("Loading all marginfi %s account addresses", account_type)

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
        """
        Cleans up connections.
        """

        logger = self._get_logger()
        logger.debug("Terminating RPC connection")

        await self._program.close()

    @staticmethod
    def _get_logger():
        return get_logger(f"{__name__}.MarginfiClient")
