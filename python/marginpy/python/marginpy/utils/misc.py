import json
import os
from typing import Any, Dict, Optional

from anchorpy import Idl
from solana.keypair import Keypair
from solana.publickey import PublicKey
from solana.rpc.async_api import AsyncClient
from solana.transaction import Transaction
from spl.token.instructions import (
    create_associated_token_account,
    get_associated_token_address,
)


def load_idl(idl_path: Optional[str] = None) -> Idl:
    if idl_path is None:
        idl_path = os.path.join(os.path.dirname(__file__), "../idl.json")
    with open(idl_path, "r", encoding="utf-8") as idl_raw:
        raw_idl = json.load(idl_raw)
    idl = Idl.from_json(raw_idl)
    return idl


# empty dictionnary default safe here because we do use `overrides` read-only
# ref: https://stackoverflow.com/questions/26320899/ \
#        why-is-the-empty-dictionary-a-dangerous-default-value-in-python/26320917#26320917)
def handle_override(
    override_key: str,
    default: Any,
    overrides: Dict[Any, Any] = {},
):  # pylint: disable=dangerous-default-value
    if overrides is None:
        return default
    return overrides[override_key] if override_key in overrides.keys() else default


async def get_or_create_ata(
    rpc_client: AsyncClient,
    payer_keypair: Keypair,
    mint_pk: PublicKey,
    owner: PublicKey = None,
) -> PublicKey:
    """Idempotent ATA helper that creates the owner's ATA if it does not exist yet, and returns its address

    Args:
        rpc_client (AsyncClient): RPC client
        owner_keypair (Keypair): keypair of ATA owner
        mint_pk (PublicKey): ATA mint

    Returns:
        PublicKey: ATA address
    """

    if owner is None:
        owner = payer_keypair.public_key

    ata = get_associated_token_address(owner, mint_pk)

    resp = await rpc_client.get_account_info(ata)
    ata_account_info = resp["result"]["value"]
    if ata_account_info is None:
        create_ata_ix = create_associated_token_account(owner, owner, mint_pk)
        tx = Transaction().add(create_ata_ix)
        resp = await rpc_client.send_transaction(tx, payer_keypair)
        await rpc_client.confirm_transaction(resp["result"])

    return ata
