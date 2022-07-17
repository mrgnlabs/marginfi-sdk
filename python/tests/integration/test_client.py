from time import sleep
from pytest import mark
from solana.rpc.async_api import AsyncClient
from anchorpy import Wallet, Provider, Program
from marginpy import MarginfiConfig, Environment, MarginfiClient
from marginpy.utils import load_idl, AccountType
from tests.fixtures import REAL_ACCOUNT_PUBKEY_2
from tests.utils import load_marginfi_group, load_client


@mark.integration
@mark.devnet
class TestMarginfiClient:
    def test_constructor(self):
        config = MarginfiConfig(Environment.DEVNET)
        wallet = Wallet.local()
        rpc_client = AsyncClient("https://devnet.genesysgo.net/")
        provider = Provider(rpc_client, wallet)
        program = Program(load_idl(), config.program_id, provider=provider)
        _, group = load_marginfi_group("marginfi_group_2")
        client = MarginfiClient(config, program, group)

        assert isinstance(client, MarginfiClient)

    # /!\ more test setup required to allow for more stringent tests /!\

    @mark.asyncio
    async def test_get_own_marginfi_accounts(self):
        client = load_client()
        await client.get_own_marginfi_accounts()

    @mark.asyncio
    async def test_get_all_marginfi_account_addresses(self):
        client = load_client()
        await client.get_all_marginfi_account_addresses()

    @mark.asyncio
    async def test_get_all_marginfi_accounts(self):
        client = load_client()
        await client.get_all_marginfi_accounts()

    @mark.asyncio
    async def test_get_marginfi_account(self):
        client = load_client()
        account = await client.get_marginfi_account(REAL_ACCOUNT_PUBKEY_2)

        config = MarginfiConfig(Environment.DEVNET)
        assert account.group.pubkey == config.group_pk
        assert account.pubkey == REAL_ACCOUNT_PUBKEY_2
        assert account.client == client

    @mark.asyncio
    async def test_get_all_program_account_addresses(self):
        client = load_client()
        await client.get_all_program_account_addresses(AccountType.MarginfiGroup)

    @mark.asyncio
    async def test_create_marginfi_account(self):
        client = load_client(group_name="marginfi_group_2")
        config = MarginfiConfig(Environment.DEVNET)

        account_address, _ = await client.create_marginfi_account()
        account = await client.get_marginfi_account(account_address.pubkey)
        assert account.group.pubkey == config.group_pk
