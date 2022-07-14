from pytest import mark
from solana.publickey import PublicKey
from solana.rpc.async_api import AsyncClient
from anchorpy import Wallet
from marginpy import MarginfiConfig, Environment, MarginfiClient, MarginfiAccount
from marginpy.utils import b64str_to_bytes, UtpIndex, UtpData
from tests.utils import load_marginfi_account, load_marginfi_group, \
    load_sample_account_info, load_marginfi_account_data


@mark.asyncio
class TestMarginfiAccount:

    def test_decode(self):
        _, account_info = load_sample_account_info("marginfi_account_1")
        account_data = b64str_to_bytes(account_info.data[0])
        MarginfiAccount.decode(account_data)

    def test_from_account_data_raw_factory(self):
        account_address, account_info = load_sample_account_info()
        config = MarginfiConfig(Environment.MAINNET)
        wallet = Wallet.local()
        rpc_client = AsyncClient("https://marginfi.genesysgo.net/")
        client = MarginfiClient(config, wallet, rpc_client)
        _, group = load_marginfi_group("marginfi_group_1")
        account_data = b64str_to_bytes(account_info.data[0])
        account = MarginfiAccount.from_account_data_raw(account_address, client, account_data, group)
        assert isinstance(account, MarginfiAccount)
        assert account.pubkey == PublicKey("C51P2JKDB3KFPGgcFGmyaWtKcKo58Dez5VSccGjhVfX9")
        assert account.authority == PublicKey("9pagApkYSTp9sRqmMNwXWt1jyatt5Md2yURV2f92X1Fh")
        assert account.group.pubkey == PublicKey("Fp3Ytjx9XVT4Sbv78ddkBC2HtT6nomVjtAjMTZwcDcba")
        assert account.deposits == 0
        assert account.borrows == 55.04156512769406

    def test_from_account_data_factory(self):
        account_address, account_data = load_marginfi_account_data("marginfi_account_1")
        config = MarginfiConfig(Environment.MAINNET)
        wallet = Wallet.local()
        rpc_client = AsyncClient("https://marginfi.genesysgo.net/")
        client = MarginfiClient(config, wallet, rpc_client)
        _, group = load_marginfi_group("marginfi_group_1")
        account = MarginfiAccount.from_account_data(account_address, client, account_data, group)
        assert isinstance(account, MarginfiAccount)
        assert account.pubkey == PublicKey("C51P2JKDB3KFPGgcFGmyaWtKcKo58Dez5VSccGjhVfX9")
        assert account.authority == PublicKey("9pagApkYSTp9sRqmMNwXWt1jyatt5Md2yURV2f92X1Fh")
        assert account.group.pubkey == PublicKey("Fp3Ytjx9XVT4Sbv78ddkBC2HtT6nomVjtAjMTZwcDcba")
        assert account.deposits == 0
        assert account.borrows == 55.04156512769406

    async def test_fetch(self):
        config = MarginfiConfig(Environment.MAINNET)
        wallet = Wallet.local()
        rpc_client = AsyncClient("https://marginfi.genesysgo.net/")
        client = MarginfiClient(config, wallet, rpc_client)
        marginfi_account_pk = PublicKey("C51P2JKDB3KFPGgcFGmyaWtKcKo58Dez5VSccGjhVfX9")
        await MarginfiAccount.fetch(marginfi_account_pk, client)

    async def test_reload(self):
        _, account = load_marginfi_account("marginfi_account_1")
        await account.reload()

    def test_accessors(self):
        _, account = load_marginfi_account("marginfi_account_1")
        assert account.pubkey == PublicKey("C51P2JKDB3KFPGgcFGmyaWtKcKo58Dez5VSccGjhVfX9")
        assert account.authority == PublicKey("9pagApkYSTp9sRqmMNwXWt1jyatt5Md2yURV2f92X1Fh")
        assert account.group.pubkey == PublicKey("Fp3Ytjx9XVT4Sbv78ddkBC2HtT6nomVjtAjMTZwcDcba")
        assert account.deposits == 0
        assert account.borrows == 55.04156512769406

    def test_all_utps(self):
        _, account = load_marginfi_account("marginfi_account_1")
        assert account.all_utps == []

    def test_active_utps(self):
        _, account = load_marginfi_account("marginfi_account_1")
        assert account.active_utps == []

    async def test__pack_utp_data(self):
        config = MarginfiConfig(Environment.MAINNET)
        wallet = Wallet.local()
        rpc_client = AsyncClient("https://marginfi.genesysgo.net/")
        client = MarginfiClient(config, wallet, rpc_client)

        marginfi_account_pk = PublicKey("C51P2JKDB3KFPGgcFGmyaWtKcKo58Dez5VSccGjhVfX9")
        data = await MarginfiAccount._fetch_account_data(
            marginfi_account_pk,
            client.config,
            client.program.provider.connection
        )

        res_exp = UtpData(account_config=data.utp_account_config[UtpIndex.Mango],
                          is_active=data.active_utps[UtpIndex.Mango])
        assert MarginfiAccount._pack_utp_data(data, UtpIndex.Mango) == res_exp
