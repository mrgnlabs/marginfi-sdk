from anchorpy import Provider
from solana.publickey import PublicKey
from solana.transaction import (
    AccountMeta,
    Transaction,
    TransactionInstruction,
    TransactionSignature,
)
from spl.token.constants import TOKEN_PROGRAM_ID


def make_request_units_ix(
    units: int,
    additional_fee: int,
) -> TransactionInstruction:
    data = b"\x00" + units.to_bytes(4, "little") + additional_fee.to_bytes(4, "little")
    return TransactionInstruction(
        [], PublicKey("ComputeBudget111111111111111111111111111111"), data
    )


FAUCET_PROGRAM_ID = PublicKey("4bXpkKSV8swHSnwqtzuboGPaPDeEgAn4Vt8GfarV5rZt")


async def airdrop_collateral(
    provider: Provider,
    amount: int,
    mint_pk: PublicKey,
    token_account: PublicKey,
    faucet: PublicKey,
) -> TransactionSignature:
    faucet_pda, _ = PublicKey.find_program_address([b"faucet"], FAUCET_PROGRAM_ID)
    keys = [
        AccountMeta(pubkey=faucet_pda, is_signer=False, is_writable=False),
        AccountMeta(pubkey=mint_pk, is_signer=False, is_writable=True),
        AccountMeta(pubkey=token_account, is_signer=False, is_writable=True),
        AccountMeta(pubkey=TOKEN_PROGRAM_ID, is_signer=False, is_writable=False),
        AccountMeta(pubkey=faucet, is_signer=False, is_writable=False),
    ]
    data = b"\x01" + amount.to_bytes(8, "little")
    airdrop_ix = TransactionInstruction(keys, FAUCET_PROGRAM_ID, data)
    tx = Transaction().add(airdrop_ix)
    sig = await provider.send(tx)
    return sig
