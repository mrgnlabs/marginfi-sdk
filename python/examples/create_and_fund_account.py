import asyncio
import logging
import os
from anchorpy import Wallet
from marginpy import MarginfiClient
from marginpy import MarginfiConfig
from marginpy import Environment
from marginpy.utils.data_conversion import ui_to_native
from marginpy.utils.instructions import airdrop_collateral
from marginpy.utils.misc import get_or_create_ata
from solana.publickey import PublicKey
from solana.rpc.async_api import AsyncClient
from dotenv import find_dotenv, load_dotenv

load_dotenv(find_dotenv())

rpc_endpoint = os.getenv("RPC_ENDPOINT")
environment = os.getenv("ENV")

deposit_amount = 10

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

    DEVNET_USDC_FAUCET = PublicKey("B87AhxX6BkBsj3hnyHzcerX2WxPoACC7ZyDr8E7H9geN")
    await airdrop_collateral(
        client.provider,
        ui_to_native(deposit_amount),
        config.collateral_mint_pk,
        ata,
        DEVNET_USDC_FAUCET,
    )

    await account.deposit(deposit_amount)
    await account.mango.activate()
    await account.mango.deposit(deposit_amount / 2)
    await account.zo.activate()
    await account.zo.deposit(deposit_amount / 2)

    await account.reload(observe_utps=True)
    print(account)


if __name__ == "__main__":
    asyncio.run(main())
