import asyncio
import logging
import os

from anchorpy import Wallet
from dotenv import find_dotenv, load_dotenv
from marginpy import Environment, MarginfiClient, MarginfiConfig
from marginpy.utils.data_conversion import ui_to_native
from marginpy.utils.instructions import airdrop_collateral
from marginpy.utils.misc import get_or_create_ata
from solana.publickey import PublicKey
from solana.rpc.async_api import AsyncClient

load_dotenv(find_dotenv())

rpc_endpoint = os.getenv("RPC_ENDPOINT")
environment = os.getenv("ENV")

DEPOSIT_AMOUNT = 10

logging.basicConfig(
    level=logging.INFO,
)


async def main():
    config = MarginfiConfig(Environment[environment])
    rpc_client = AsyncClient(rpc_endpoint, config.tx_opts.preflight_commitment)
    wallet = Wallet.local()
    client = await MarginfiClient.fetch(config, wallet, rpc_client)
    account, _ = await client.create_marginfi_account()

    ata = await get_or_create_ata(
        rpc_client=rpc_client,
        payer_keypair=wallet.payer,
        mint_pk=config.collateral_mint_pk,
    )

    devnet_usdc_faucet = PublicKey("B87AhxX6BkBsj3hnyHzcerX2WxPoACC7ZyDr8E7H9geN")
    await airdrop_collateral(
        client.provider,
        ui_to_native(DEPOSIT_AMOUNT),
        config.collateral_mint_pk,
        ata,
        devnet_usdc_faucet,
    )

    await account.deposit(DEPOSIT_AMOUNT)
    await account.mango.activate()
    await account.mango.deposit(DEPOSIT_AMOUNT / 2)
    await account.zo.activate()
    await account.zo.deposit(DEPOSIT_AMOUNT / 2)

    await account.reload(observe_utps=True)
    print(account)


if __name__ == "__main__":
    asyncio.run(main())
