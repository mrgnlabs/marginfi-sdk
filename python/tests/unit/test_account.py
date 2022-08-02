from anchorpy import Program, Provider, Wallet
from marginpy import Environment, MarginfiAccount, MarginfiClient, MarginfiConfig
from marginpy.types import UtpData, UtpIndex
from marginpy.utils.data_conversion import b64str_to_bytes
from marginpy.utils.misc import load_idl
from marginpy.utp.mango import UtpMangoAccount
from pytest import approx, mark
from solana.publickey import PublicKey
from solana.rpc.async_api import AsyncClient

from tests.fixtures import REAL_ACCOUNT_PUBKEY_2
from tests.utils import (
    load_marginfi_account,
    load_marginfi_account_data,
    load_marginfi_group,
    load_sample_account_info,
)


@mark.unit
class TestMarginfiAccountUnit:
    def test_decode(self):
        _, account_info = load_sample_account_info("marginfi_account_2")
        account_data = b64str_to_bytes(account_info.data[0])
        MarginfiAccount.decode(account_data)

    def test_from_account_data_raw_factory(self):
        account_address, account_info = load_sample_account_info()
        config = MarginfiConfig(Environment.DEVNET)
        wallet = Wallet.local()
        rpc_client = AsyncClient("https://devnet.genesysgo.net/")
        provider = Provider(rpc_client, wallet)
        program = Program(load_idl(), config.program_id, provider=provider)
        _, group = load_marginfi_group("marginfi_group_2")
        client = MarginfiClient(config, program, group)
        account_data = b64str_to_bytes(account_info.data[0])
        account = MarginfiAccount.from_account_data_raw(
            account_address, client, account_data, group
        )
        assert isinstance(account, MarginfiAccount)
        assert account.pubkey == REAL_ACCOUNT_PUBKEY_2
        assert account.authority == PublicKey(
            "3xo9RzjFEKRqLYQjfxTP9oKCPF6ukfDsqJ2hUhJhv55W"
        )
        assert account.group.pubkey == PublicKey(
            "GoAzFyYE1xRsbT4C5MHJh8hBd5s6Jks9j4hLrtWR3pba"
        )
        assert account.deposits == approx(143, 0.000001)
        assert account.borrows == 0.0

    def test_from_account_data_factory(self):
        account_address, account_data = load_marginfi_account_data("marginfi_account_2")
        config = MarginfiConfig(Environment.DEVNET)
        wallet = Wallet.local()
        rpc_client = AsyncClient("https://devnet.genesysgo.net/")
        provider = Provider(rpc_client, wallet)
        program = Program(load_idl(), config.program_id, provider=provider)
        _, group = load_marginfi_group("marginfi_group_2")
        client = MarginfiClient(config, program, group)
        account = MarginfiAccount.from_account_data(
            account_address, client, account_data, group
        )
        assert isinstance(account, MarginfiAccount)
        assert account.pubkey == REAL_ACCOUNT_PUBKEY_2
        assert account.authority == PublicKey(
            "3xo9RzjFEKRqLYQjfxTP9oKCPF6ukfDsqJ2hUhJhv55W"
        )
        assert account.group.pubkey == PublicKey(
            "GoAzFyYE1xRsbT4C5MHJh8hBd5s6Jks9j4hLrtWR3pba"
        )
        assert account.deposits == approx(143, 0.000001)
        assert account.borrows == 0.0

    def test_accessors(self):
        _, account = load_marginfi_account("marginfi_account_2")
        assert account.pubkey == REAL_ACCOUNT_PUBKEY_2
        assert account.authority == PublicKey(
            "3xo9RzjFEKRqLYQjfxTP9oKCPF6ukfDsqJ2hUhJhv55W"
        )
        assert account.group.pubkey == PublicKey(
            "GoAzFyYE1xRsbT4C5MHJh8hBd5s6Jks9j4hLrtWR3pba"
        )
        assert account.deposits == approx(143, 0.000001)
        assert account.borrows == 0.0

    def test_all_utps(self):
        _, account = load_marginfi_account("marginfi_account_2")
        assert len(account.all_utps) == 2
        assert isinstance(account.all_utps[0], UtpMangoAccount)

    def test_active_utps(self):
        _, account = load_marginfi_account("marginfi_account_2")
        assert len(account.active_utps) == 2

    def test__pack_utp_data(self):
        _, account_info = load_sample_account_info("marginfi_account_2")
        data_raw = b64str_to_bytes(account_info.data[0])
        data_decoded = MarginfiAccount.decode(data_raw)
        res_exp = UtpData(
            account_config=data_decoded.utp_account_config[UtpIndex.MANGO],
            is_active=data_decoded.active_utps[UtpIndex.MANGO],
        )
        assert MarginfiAccount._pack_utp_data(data_decoded, UtpIndex.MANGO) == res_exp
