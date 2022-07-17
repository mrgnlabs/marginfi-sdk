"""This module contains the Provider class and associated utilities."""
from __future__ import annotations

from builtins import enumerate
from typing import List, Tuple, Optional
from anchorpy import Wallet, Provider, Program, AccountsCoder, ProgramAccount
from anchorpy.provider import DEFAULT_OPTIONS
from based58 import b58encode
from solana.keypair import Keypair
from solana.rpc import types
from solana.rpc.async_api import AsyncClient
from solana.rpc.types import DataSliceOpts, MemcmpOpts
from solana.transaction import Transaction, TransactionSignature
from solana.publickey import PublicKey

import marginpy
from marginpy.instruction import make_init_marginfi_account_ix, InitMarginfiAccountAccounts
from marginpy.utils import load_idl, AccountType


class MarginfiClient:
    _program: Program
    _config: marginpy.MarginfiConfig
    _group: marginpy.MarginfiGroup

    def __init__(self,
                 config: marginpy.MarginfiConfig,
                 program: Program,
                 group: marginpy.MarginfiGroup):
        self._config = config
        self._program = program
        self._group = group

    # --- Factories

    @staticmethod
    async def fetch(
            config: marginpy.MarginfiConfig,
            wallet: Wallet,
            rpc_client: AsyncClient,
            opts: types.TxOpts = DEFAULT_OPTIONS,
    ) -> MarginfiClient:
        provider = Provider(rpc_client, wallet, opts)
        program = Program(load_idl(), config.program_id, provider=provider)
        group = await marginpy.MarginfiGroup.fetch(config, program)
        return MarginfiClient(config, program, group)

    @staticmethod
    async def from_env():
        pass

    # --- Getters and setters

    @property
    def program(self) -> Program:
        """Anchor program"""

        return self._program

    @property
    def group(self) -> marginpy.MarginfiGroup:
        """Marginfi account group address"""

        return self._group

    @property
    def config(self) -> marginpy.MarginfiConfig:
        """Client config"""

        return self._config

    @property
    def program_id(self) -> PublicKey:
        """Marginfi program ID"""

        return self._program.program_id

    # --- Others

    async def create_marginfi_account(self) -> Tuple[marginpy.MarginfiAccount, TransactionSignature]:
        """
        * Create a new marginfi account under the authority of the user.
        *
        * @returns MarginfiAccount instance
        """
        account_keypair = Keypair()
        account_pk = account_keypair.public_key
        print(f"Creating Marginfi account {account_pk}")

        create_marginfi_account_account_ix = await self._program.account[
            AccountType.MarginfiAccount.value].create_instruction(account_keypair)
        init_marginfi_account_ix = make_init_marginfi_account_ix(
            InitMarginfiAccountAccounts(
                marginfi_group=self.group.pubkey,
                marginfi_account=account_pk,
                authority=self._program.provider.wallet.public_key
            ),
            self.program_id
        )
        tx = Transaction().add(create_marginfi_account_account_ix, init_marginfi_account_ix)
        sig = await self._program.provider.send(tx, signers=[account_keypair])
        account = await marginpy.MarginfiAccount.fetch(account_pk, self)
        return account, sig

    async def get_own_marginfi_accounts(self) -> List[marginpy.MarginfiAccount]:
        """
        Retrieves all marginfi accounts under the authority of the user.
        
        :returns: marginfi account instances
        """

        marginfi_group = await marginpy.MarginfiGroup.fetch(self._config, self._program)
        all_accounts = await self._program.account["MarginfiAccount"].all(
            memcmp_opts=[
                # authority is the first field in the account, so only offset is the discriminant
                MemcmpOpts(bytes=self._program.provider.wallet.public_key.to_base58().decode('utf-8'), offset=8),
                # marginfiGroup is the second field in the account after the authority,
                # so offset by the discriminant and a pubkey
                MemcmpOpts(bytes=self._group.pubkey.to_base58().decode('utf-8'), offset=8 + 32)
            ]
        )

        def convert(pa: ProgramAccount):
            return marginpy.MarginfiAccount.from_account_data(
                pa.public_key,
                self,
                pa.account,  # type: ignore
                marginfi_group
            )

        own_accounts = map(convert, all_accounts)
        return list(own_accounts)

    async def get_all_marginfi_account_addresses(self) -> List[PublicKey]:
        coder = AccountsCoder(load_idl())
        discriminator: bytes = coder.acc_name_to_discriminator[AccountType.MarginfiAccount.value]
        rpc_response = await self._program.provider.connection.get_program_accounts(
            self.program_id,
            encoding="base64",
            commitment=self._program.provider.connection.commitment,
            data_slice=DataSliceOpts(offset=0, length=0),
            memcmp_opts=[MemcmpOpts(bytes=self._group.pubkey.to_base58().decode('utf-8'), offset=8 + 32),
                         MemcmpOpts(offset=0, bytes=b58encode(discriminator).decode("ascii"))]
        )
        if "error" in rpc_response.keys():
            raise Exception(f"Error while fetching marginfi accounts addresses: {rpc_response['error']}")
        accounts = rpc_response["result"]
        return [a["pubkey"] for a in accounts if a is not None]

    async def get_all_marginfi_accounts(self) -> List[marginpy.MarginfiAccount]:
        """
        Retrieves all marginfi accounts in the underlying group.
        
        :returns: marginfi account instances
        """

        marginfi_group = await marginpy.MarginfiGroup.fetch(self._config, self._program)
        marginfi_account_addresses = await self.get_all_marginfi_account_addresses()
        fetch_results = await self._program.account[AccountType.MarginfiAccount.value].fetch_multiple(
            marginfi_account_addresses
        )
        all_accounts = []
        for i, account_data in enumerate(fetch_results):
            if account_data is None:
                continue
            all_accounts.append(
                marginpy.MarginfiAccount.from_account_data(marginfi_account_addresses[i],
                                                           self,
                                                           account_data,  # type: ignore
                                                           marginfi_group))
        return all_accounts

    async def get_marginfi_account(self, address: PublicKey) -> marginpy.MarginfiAccount:
        return await marginpy.MarginfiAccount.fetch(address, self)

    async def get_all_program_account_addresses(self, account_type: AccountType) -> List[PublicKey]:
        """
        Retrieves the addresses of all accounts owned by the marginfi program.
        
        :returns: account addresses
        """

        coder = AccountsCoder(load_idl())
        discriminator: bytes = coder.acc_name_to_discriminator[account_type.value]
        rpc_response = await self._program.provider.connection.get_program_accounts(
            self.program_id,
            encoding="base64",
            commitment=self._program.provider.connection.commitment,
            data_slice=DataSliceOpts(offset=0, length=0),
            memcmp_opts=[MemcmpOpts(bytes=self._group.pubkey.to_base58().decode('utf-8'), offset=8 + 32),
                         MemcmpOpts(offset=0, bytes=b58encode(discriminator).decode("ascii"))]
        )
        if "error" in rpc_response.keys():
            raise Exception(f"Error while fetching marginfi accounts addresses: {rpc_response['error']}")
        accounts = rpc_response["result"]
        return [a["pubkey"] for a in accounts if a is not None]

    async def terminate(self) -> None:
        await self._program.close()
