import pytest

import os
import json

from solana.rpc.async_api import AsyncClient
from anchorpy import Wallet, Program, Provider, Idl
from anchorpy.provider import DEFAULT_OPTIONS

from marginpy import MarginfiConfig, Environment, Bank

@pytest.mark.asyncio
class MarginfiGroup:

    # @todo incomplete -- need bank
    # def test___init__(self):
    #     config = MarginfiConfig(Environment.MAINNET)

    #     rpc_client = AsyncClient("https://marginfi.genesysgo.net/")
    #     wallet = Wallet.local()
    #     idl_path = os.path.join(os.path.dirname(__file__), "idl.json")
    #     with open(idl_path) as f:
    #         raw_idl = json.load(f)
    #     idl = Idl.from_json(raw_idl)
    #     opts = DEFAULT_OPTIONS
    #     provider = Provider(rpc_client, wallet, opts)
    #     program = Program(idl, config.program_id, provider=provider)

    #     admin = wallet.public_key

    #     bank = # @todo

    #     group = MarginfiGroup(
    #         config,
    #         program,
    #         admin,
    #         bank
    #     )

    #     assert isinstance(group, MarginfiGroup)

    # --- Factories

    ###
    # MarginfiGroup network factory
    #
    # Fetch account data according to the config and instantiate the corresponding MarginfiGroup.
    #
    # @param config marginfi config
    # @param program marginfi Anchor program
    # @return MarginfiGroup instance
    ###
    