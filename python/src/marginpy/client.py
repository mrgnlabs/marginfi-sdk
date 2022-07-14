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

from marginpy.generated_client.instructions import InitMarginfiAccountAccounts
from marginpy.instruction import make_init_marginfi_account_ix
from marginpy.config import MarginfiConfig
from marginpy.group import MarginfiGroup


class MarginfiClient:
    program: Program
    config: MarginfiConfig
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

    async def terminate(self) -> None:
        await self.program.close()
