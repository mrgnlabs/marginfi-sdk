from pytest import mark, raises
from solana.publickey import PublicKey
from solana.rpc.async_api import AsyncClient
from anchorpy import Wallet, Program, Provider
from marginpy import MarginfiConfig, Environment, MarginfiClient, MarginfiAccount
from marginpy.utils import b64str_to_bytes, UtpIndex, UtpData, load_idl
from tests.fixtures import REAL_ACCOUNT_PUBKEY_2
from tests.utils import (
    load_marginfi_account,
    load_marginfi_group,
    load_sample_account_info,
    load_marginfi_account_data,
)
from marginpy import utp_observation


@mark.unit
class TestMarginfiAccountUnit:
    def test_observe_mango_success(self):
        mango_group = b64str_to_bytes(load_sample_account_info("mango_group")[1].data[0])
        mango_account = b64str_to_bytes(load_sample_account_info("mango_account")[1].data[0])
        mango_cache = b64str_to_bytes(load_sample_account_info("mango_cache")[1].data[0])
        assert utp_observation.mango.get_free_collateral(mango_group, mango_account, mango_cache) == 888

    def test_observe_mango_throw(self):
        with raises(ValueError) as exc:
            assert utp_observation.mango.get_free_collateral(b"", b"", b"") == 888
        assert (exc.value.args[0] == "SizeMismatch")

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
            "E5SUBkeCKPrmT77f6grSJXnLgLMed2pkSWr9NVXu9Nog"
        )
        assert account.group.pubkey == PublicKey(
            "7AYHgp3Z8AriGTVKYZ8c7GdW5m2Y3cBDacmWEuPGD2Gg"
        )
        assert account.deposits == 100323.12943728785
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
            "E5SUBkeCKPrmT77f6grSJXnLgLMed2pkSWr9NVXu9Nog"
        )
        assert account.group.pubkey == PublicKey(
            "7AYHgp3Z8AriGTVKYZ8c7GdW5m2Y3cBDacmWEuPGD2Gg"
        )
        assert account.deposits == 100323.12943728785
        assert account.borrows == 0.0

    def test_accessors(self):
        _, account = load_marginfi_account("marginfi_account_2")
        assert account.pubkey == REAL_ACCOUNT_PUBKEY_2
        assert account.authority == PublicKey(
            "E5SUBkeCKPrmT77f6grSJXnLgLMed2pkSWr9NVXu9Nog"
        )
        assert account.group.pubkey == PublicKey(
            "7AYHgp3Z8AriGTVKYZ8c7GdW5m2Y3cBDacmWEuPGD2Gg"
        )
        assert account.deposits == 100323.12943728785
        assert account.borrows == 0.0

    def test_all_utps(self):
        _, account = load_marginfi_account("marginfi_account_2")
        assert account.all_utps == []

    def test_active_utps(self):
        _, account = load_marginfi_account("marginfi_account_2")
        assert account.active_utps == []

    def test__pack_utp_data(self):
        _, account_info = load_sample_account_info("marginfi_account_2")
        data_raw = b64str_to_bytes(account_info.data[0])
        data_decoded = MarginfiAccount.decode(data_raw)
        res_exp = UtpData(
            account_config=data_decoded.utp_account_config[UtpIndex.Mango],
            is_active=data_decoded.active_utps[UtpIndex.Mango],
        )
        assert MarginfiAccount._pack_utp_data(data_decoded, UtpIndex.Mango) == res_exp
