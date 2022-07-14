"""This module contains the Provider class and associated utilities."""
from __future__ import annotations

import json
import os

from anchorpy import Wallet, Provider, Program, Idl
from anchorpy.provider import DEFAULT_OPTIONS
from solana.keypair import Keypair
from solana.rpc import types
from solana.rpc.async_api import AsyncClient
from solana.system_program import SYS_PROGRAM_ID
from solana.transaction import Transaction, TransactionSignature
from solana.publickey import PublicKey

from marginpy.generated_client.instructions import InitMarginfiAccountAccounts
from marginpy.instruction import make_init_marginfi_account_ix
from marginpy.config import MarginfiConfig
from marginpy.group import MarginfiGroup
from marginpy.account import MarginfiAccount
from marginpy.utils import AccountType


class MarginfiClient:
    program: Program
    config: MarginfiConfig
    program_id: PublicKey
    group: MarginfiGroup

    def __init__(
            self,
            config: MarginfiConfig,
            wallet: Wallet,
            rpc_client: AsyncClient,
            opts: types.TxOpts = DEFAULT_OPTIONS,
    ) -> None:
        self.provider = Provider(rpc_client, wallet, opts)
        self.config = config

        idl_path = os.path.join(os.path.dirname(__file__), "idl.json")
        with open(idl_path) as f:
            raw_idl = json.load(f)
        idl = Idl.from_json(raw_idl)
        self.program = Program(idl, config.program_id, provider=self.provider)

    # async def from_env():
    #     pass
    
    # --- Getters and setters

    @property
    def group(self) -> MarginfiGroup:
        """Marginfi account group address"""

        return self._group

    # --- Others

    async def create_marginfi_account(self) -> TransactionSignature:
        """
        * Create a new marginfi account under the authority of the user.
        *
        * @returns MarginfiAccount instance
        """
        marginfi_account_key = Keypair()
        print(f"Creating Marginfi account {marginfi_account_key.public_key}")

        create_marginfi_account_account_ix = await self.program.account["marginfi_account"].create_instruction(
            marginfi_account_key
        )
        init_marginfi_account_ix = await make_init_marginfi_account_ix(
            InitMarginfiAccountAccounts(
                marginfi_group=self.group.pubkey,
                marginfi_account=marginfi_account_key.public_key,
                authority=self.program.provider.wallet.public_key,
                system_program=SYS_PROGRAM_ID)
        )
        tx = Transaction().add(create_marginfi_account_account_ix, init_marginfi_account_ix)
        return await self.program.provider.send(tx)

    async def get_own_marginfi_accounts(self):
        """
        Retrieves all marginfi accounts under the authority of the user.
        
        :returns: MarginfiAccount instances
        """
        marginfi_group = await MarginfiGroup.fetch(self.config, self.program)
        all_accounts = self.program.account.marginfi_account.all(
            [
                {
                    "memcmp": {
                        "bytes": "TODO",
                        "offset": 8, # authority is the first field in the account, so only offset is the discriminant
                    },
                },
                {
                    "memcmp": {
                        "bytes": self._group.public_key.to_base58(),
                        "offset": 8 + 32, # marginfiGroup is the second field in the account after the authority, so offset by the discriminant and a pubkey
                    }
                }
            ]
        )

        return [
            MarginfiAccount.from_accont_data(
                a.public_key,
                self,
                a.account, #@todo this may need to be typed as MarginfiAccountData
                marginfi_group
            ) for a in all_accounts
        ]

    async def get_all_marginfi_accounts(self):
        """
        Retrieves all marginfi accounts in the underlying group.
        
        :returns: MarginfiAccount instances
        """

        marginfi_group = await MarginfiGroup.fetch(self.config, self.program)
        marginfi_account_addresses = await self.get_all_marginfi_account_addresses()

        mult_addresses = await self.program.account.marginfi_account.fetch_multiple(
            marginfi_account_addresses
        )
        filtered = [x for x in mult_addresses if x is not None]
        
        return [
            MarginfiAccount.from_account_data(
                marginfi_account_addresses[i],
                self,
                account, #@todo may need to be converted to MarginfiAccountData
                marginfi_group
            ) for account, i in filtered
        ]
        

    async def get_marginfi_account(self, address: PublicKey):
        return MarginfiAccount.fetch(address, self)

    async def get_all_marginfi_account_addresses(self):
        res = await self.program.provider.connection.get_program_accounts(
            self.program_id,
            {
                "commitment": self.program.provider.connection.commitment,
                "data_slice": {
                    "offset": 0,
                    "length": 0,
                },
                "filters": [
                    {
                        "memcmp": {
                            "offset": 0,
                            "bytes": "TODO",
                        }
                    }
                ]
            }
        )

        return [a.pubkey for a in res]

    async def get_all_program_account_addresses(self, type: AccountType):
        """
        Retrieves the addresses of all accounts owned by the marginfi program.
        
        :returns: Account addresses
        """
        
        res = await self.program.provider.connection.get_program_accounts(
            self.program_id,
            {
                "commitment": self.program.provider.connection.commitment,
                "data_slice": {
                    "offset": 0,
                    "length": 0,
                },
                "filters": [
                    {
                        "memcmp": {
                            "offset": 0,
                            "bytes": "TODO",
                        }
                    }
                ]
            }
        )

        return [a.pubkey for a in res]

    async def terminate(self) -> None:
        await self.program.close()
