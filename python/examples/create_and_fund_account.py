import asyncio
import logging

from dotenv import find_dotenv, load_dotenv
from marginpy import MarginfiClient
from marginpy.logger import setup_logging
from marginpy.utils.data_conversion import ui_to_native
from marginpy.utils.instructions import airdrop_collateral
from marginpy.utils.misc import get_or_create_ata
from solana.publickey import PublicKey

load_dotenv(find_dotenv())
setup_logging(logging.DEBUG)

DEPOSIT_AMOUNT = 10


async def main():
    client = await MarginfiClient.from_env()
    account, _ = await client.create_marginfi_account()

    ata = await get_or_create_ata(
        rpc_client=client.provider.connection,
        payer_keypair=client.provider.wallet.payer,
        mint_pk=client.config.collateral_mint_pk,
    )

    devnet_usdc_faucet = PublicKey("B87AhxX6BkBsj3hnyHzcerX2WxPoACC7ZyDr8E7H9geN")
    await airdrop_collateral(
        client.provider,
        ui_to_native(DEPOSIT_AMOUNT),
        client.config.collateral_mint_pk,
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
