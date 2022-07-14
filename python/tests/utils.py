import json
import os
from typing import Tuple

from anchorpy import Wallet
from solana.publickey import PublicKey
from solana.rpc.async_api import AsyncClient
from solana.rpc.responses import AccountInfo

from marginpy import MarginfiAccount, MarginfiConfig, Environment, MarginfiClient, MarginfiGroup
from marginpy.generated_client.accounts import MarginfiAccount as MarginfiAccountData, \
    MarginfiGroup as MarginfiGroupData


# --- Marginfi group
from marginpy.utils import json_to_account_info, b64str_to_bytes


def load_marginfi_group_data(name: str = "marginfi_group_1") -> Tuple[PublicKey, MarginfiGroupData]:
    account_address, account_info = load_sample_account_info(name)
    account_data = b64str_to_bytes(account_info.data[0])  # type: ignore
    marginfi_group_data = MarginfiGroup.decode(account_data)
    return account_address, marginfi_group_data


def load_marginfi_group(name: str = "marginfi_group_1") -> Tuple[PublicKey, MarginfiGroup]:
    account_address, account_info = load_sample_account_info(name)
    account_data = b64str_to_bytes(account_info.data[0])  # type: ignore
    config = MarginfiConfig(Environment.MAINNET)
    wallet = Wallet.local()
    rpc_client = AsyncClient("https://marginfi.genesysgo.net/")
    client = MarginfiClient(config, wallet, rpc_client)
    marginfi_group = MarginfiGroup.from_account_data_raw(config, client.program, account_data)
    return account_address, marginfi_group


# --- Marginfi account


def load_marginfi_account_data(name: str = "marginfi_account_1") -> Tuple[PublicKey, MarginfiAccountData]:
    account_address, account_info = load_sample_account_info(name)
    account_data = b64str_to_bytes(account_info.data[0])  # type: ignore
    marginfi_account = MarginfiAccount.decode(account_data)
    return account_address, marginfi_account


def load_marginfi_account(account_name: str = "marginfi_account_1",
                          group_name: str = "marginfi_group_1") -> Tuple[PublicKey, MarginfiAccount]:
    account_address, account_info = load_sample_account_info(account_name)
    account_data = b64str_to_bytes(account_info.data[0])  # type: ignore
    config = MarginfiConfig(Environment.MAINNET)
    wallet = Wallet.local()
    rpc_client = AsyncClient("https://marginfi.genesysgo.net/")
    client = MarginfiClient(config, wallet, rpc_client)
    _, group = load_marginfi_group(group_name)
    marginfi_account = MarginfiAccount.from_account_data_raw(account_address, client, account_data, group)
    return account_address, marginfi_account


# --- Misc


def load_sample_account_info(name: str = "marginfi_account_1") -> Tuple[PublicKey, AccountInfo]:
    account_data_path = os.path.join(os.path.dirname(__file__), f"fixtures/accounts/{name}.json")
    with open(account_data_path) as f:
        account_info_raw = json.load(f)
    account_address = PublicKey(account_info_raw['pubkey'])
    account_info = json_to_account_info(account_info_raw['account'])
    return account_address, account_info

