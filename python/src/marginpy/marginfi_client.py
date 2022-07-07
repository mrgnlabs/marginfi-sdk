"""This module contains the Provider class and associated utilities."""
from __future__ import annotations

import os

from anchorpy import Wallet, Provider, Program, Idl
from anchorpy.provider import DEFAULT_OPTIONS
from solana.rpc import types
from solana.rpc.async_api import AsyncClient

class MarginfiClient:
    program: Program
    config: MarginfiConfig

    def __init__(
        self,
        config: MarginfiConfig, wallet: Wallet, rpc_client: AsyncClient,
        opts: types.TxOpts = DEFAULT_OPTIONS,
    ) -> None:
        self.provider = Provider(rpc_client, wallet, opts)
        idl_path = os.path.join(os.path.dirname(__file__), "idl.json")
        with open(idl_path) as f:
            raw_idl = json.load(f)
        idl = Idl.from_json(raw_idl)
        self.program = Program(idl, config.ZO_PROGRAM_ID, provider=self.provider)
