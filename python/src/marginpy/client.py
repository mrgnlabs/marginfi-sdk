"""This module contains the Provider class and associated utilities."""
from __future__ import annotations

import json
import os

from anchorpy import Wallet, Provider, Program, Idl
from anchorpy.provider import DEFAULT_OPTIONS
from solana.keypair import Keypair
from solana.rpc import types
from solana.rpc.async_api import AsyncClient

from instruction import make_init_marginfi_account_ix
from config import MarginfiConfig

class MarginfiClient:
    program: Program
    config: MarginfiConfig
    group: MarginfiGroup

    def __init__(
        self,
        config: MarginfiConfig, 
        wallet: Wallet,
        rpc_client: AsyncClient, # @todo not anchorpy.Connection?
        opts: types.TxOpts = DEFAULT_OPTIONS,
    ) -> None:
        # Provider
        self.provider = Provider(rpc_client, wallet, opts)

        # Program
        idl_path = os.path.join(os.path.dirname(__file__), "idl.json")
        with open(idl_path) as f:
            raw_idl = json.load(f)
        idl = Idl.from_json(raw_idl)
        self.program = Program(idl, config.program_id, provider=self.provider)

        # Group
        self._group = MarginfiGroup(config, self.program)

    # --- Getters and setters

    @property
    def group(self):
        """
        Marginfi account group address
        """
        return self._group

    # --- Others

    async def create_marginfi_account(self):
        """
        * Create a new marginfi account under the authority of the user.
        *
        * @returns MarginfiAccount instance
        """
        marginfi_account_key = Keypair()
        print(
            "Creating Marginfi account {}".format(
                marginfi_account_key.public_key
            )
        )

        create_marginfi_account_account_ix = await self.program.account.marginfiAccount.createInstruction(
            marginfi_account_key
        )

        init_marginfi_account_ix = await make_init_marginfi_account_ix(
            self.program, 
            {
                "marginfiGroupPk": self._group.public_key,
                "marginfiAccountPk": marginfi_account_key.public_key,
                "authorityPk": self.program.provider.wallet.public_key,
            }
        )

        # const createMarginfiAccountAccountIx = await this.program.account.marginfiAccount.createInstruction(
        # marginfiAccountKey
        # );
        # const initMarginfiAccountIx = await makeInitMarginfiAccountIx(this.program, {
        # marginfiGroupPk: this._group.publicKey,
        # marginfiAccountPk: marginfiAccountKey.publicKey,
        # authorityPk: this.program.provider.wallet.publicKey,
        # });

        # const ixs = [createMarginfiAccountAccountIx, initMarginfiAccountIx];

        # const tx = new Transaction().add(...ixs);
        # const sig = await processTransaction(this.program.provider, tx, [marginfiAccountKey]);

        # dbg("Created Marginfi account %s", sig);

        # return MarginfiAccount.get(marginfiAccountKey.publicKey, this);
        return None
    