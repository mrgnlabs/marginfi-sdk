from anchorpy import Wallet, Provider, Program
from pytest import mark
from solana.publickey import PublicKey
from solana.rpc.async_api import AsyncClient

from marginpy import MarginfiGroup, Environment, MarginfiConfig, load_idl
from marginpy.utils import b64str_to_bytes
from tests.utils import load_sample_account_info, load_marginfi_group_data


@mark.unit
class TestMarginfiAccount:

    def test_decode(self):
        account_address, account_info = load_sample_account_info("marginfi_group_2")
        account_data = b64str_to_bytes(account_info.data[0])  # type: ignore
        marginfi_group_data = MarginfiGroup.decode(account_data)
        assert marginfi_group_data.admin == PublicKey("E5SUBkeCKPrmT77f6grSJXnLgLMed2pkSWr9NVXu9Nog")

    def test_from_account_data_raw_factory(self):
        account_address, account_info = load_sample_account_info("marginfi_group_2")
        account_data = b64str_to_bytes(account_info.data[0])  # type: ignore
        config = MarginfiConfig(Environment.DEVNET)
        wallet = Wallet.local()
        rpc_client = AsyncClient("https://devnet.genesysgo.net/")
        provider = Provider(rpc_client, wallet)
        program = Program(load_idl(), config.program_id, provider=provider)
        account = MarginfiGroup.from_account_data_raw(config, program, account_data)
        assert isinstance(account, MarginfiGroup)
        assert account.admin == PublicKey("E5SUBkeCKPrmT77f6grSJXnLgLMed2pkSWr9NVXu9Nog")
        assert account.pubkey == account_address

    def test_from_account_data_factory(self):
        account_address, account_data = load_marginfi_group_data("marginfi_group_2")
        config = MarginfiConfig(Environment.DEVNET)
        wallet = Wallet.local()
        rpc_client = AsyncClient("https://devnet.genesysgo.net/")
        provider = Provider(rpc_client, wallet)
        program = Program(load_idl(), config.program_id, provider=provider)
        account = MarginfiGroup.from_account_data(config, program, account_data)
        assert isinstance(account, MarginfiGroup)
        assert account.admin == PublicKey("E5SUBkeCKPrmT77f6grSJXnLgLMed2pkSWr9NVXu9Nog")
        assert account.pubkey == account_address
