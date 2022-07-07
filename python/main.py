from pathlib import Path
import asyncio
import json
from solana.rpc.async_api import AsyncClient
from solana.publickey import PublicKey
from anchorpy import Idl, Program, Provider, Wallet


async def main():
    # Read the generated IDL.
    with Path("../../target/idl/marginfi.json").open() as f:
        raw_idl = json.load(f)
    idl = Idl.from_json(raw_idl)
    print(idl)
    # Address of the deployed program.
    program_id = PublicKey.from_string("mrgnfD8pJKsw4AxCDquyUBjgABNEaZ79iTLgtov2Yff")
    print(program_id)
    client = AsyncClient("https://marginfi.genesysgo.net/")
    provider = Provider(client, Wallet.local())
    # Generate the program client from IDL.
    async with Program(idl, program_id, provider) as program:
        # Execute the RPC.
        accounts = await program.account.get("MarginfiAccount").all()
        print(len(accounts))
    # If we don't use the context manager, we need to
    # close the underlying http client, otherwise we get warnings.
    # await program.close()


asyncio.run(main())
