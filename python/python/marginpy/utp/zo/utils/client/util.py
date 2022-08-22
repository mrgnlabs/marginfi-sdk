import math
from typing import Tuple

import solana.system_program
from anchorpy import Context, Program
from marginpy.utp.zo.utils.client.types import PerpType
from solana.keypair import Keypair
from solana.publickey import PublicKey
from solana.rpc.commitment import Finalized
from solana.rpc.types import TxOpts
from solana.sysvar import SYSVAR_RENT_PUBKEY

CONTROL_ACCOUNT_SIZE = 8 + 4482


def decode_symbol(s) -> str:
    s = s.data
    i = s.index(0)
    return bytes(s[:i]).decode("utf-8")


def decode_wrapped_i80f48(n) -> float:
    return n.data / (2**48)


def div_to_float(a: int, b: int) -> float:
    q, r = divmod(a, b)
    gcd = math.gcd(r, b)
    return float(q) + (r // gcd) / (b // gcd)


def big_to_small_amount(n: int or float, /, *, decimals: int) -> int:
    shift = 10 ** abs(decimals)
    if decimals >= 0:
        integral = int(n) * shift
        fractional = int((n % 1) * shift)
        return integral + fractional
    else:
        return int(n) // shift


def small_to_big_amount(n: int or float, /, *, decimals: int):
    return n / 10**decimals


def price_to_lots(
    n: int or float,
    /,
    *,
    base_decimals: int,
    quote_decimals: int,
    base_lot_size: int,
    quote_lot_size: int,
) -> int:
    return round(
        float(n)
        * base_lot_size
        / quote_lot_size
        * 10 ** (quote_decimals - base_decimals)
    )


def lots_to_price(
    n: int,
    /,
    *,
    base_decimals: int,
    quote_decimals: int,
    base_lot_size: int,
    quote_lot_size: int,
) -> float:
    n *= quote_lot_size * 10 ** (base_decimals - quote_decimals)
    return div_to_float(n, base_lot_size)


def size_to_lots(n: float, /, *, decimals: int, lot_size: int) -> int:
    return round(n * 10**decimals) // lot_size


def lots_to_size(n: int, /, *, decimals: int, lot_size: int) -> float:
    return div_to_float(n * lot_size, 10**decimals)


def margin_pda(
    *,
    owner: PublicKey,
    state: PublicKey,
    program_id: PublicKey,
) -> Tuple[PublicKey, int]:
    return PublicKey.find_program_address(
        [
            owner.__bytes__(),
            state.__bytes__(),
            bytes("marginv1", "utf-8"),
        ],
        program_id,
    )


def open_orders_pda(
    *, control: PublicKey, dex_market: PublicKey, program_id: PublicKey
) -> Tuple[PublicKey, int]:
    return PublicKey.find_program_address(
        [control.__bytes__(), dex_market.__bytes__()], program_id
    )


def state_signer_pda(
    *,
    state: PublicKey,
    program_id: PublicKey,
) -> Tuple[PublicKey, int]:
    return PublicKey.find_program_address(
        [
            state.__bytes__(),
        ],
        program_id,
    )


async def create_margin(
    *, program: Program, state: PublicKey, key: PublicKey, nonce: int
) -> str:
    control = Keypair()
    control_lamports = (
        await program.provider.connection.get_minimum_balance_for_rent_exemption(
            CONTROL_ACCOUNT_SIZE
        )
    )["result"]
    return await program.rpc["create_margin"](
        nonce,
        ctx=Context(
            accounts={
                "state": state,
                "authority": program.provider.wallet.public_key,
                "payer": program.provider.wallet.public_key,
                "margin": key,
                "control": control.public_key,
                "rent": SYSVAR_RENT_PUBKEY,
                "system_program": solana.system_program.SYS_PROGRAM_ID,
            },
            pre_instructions=[
                solana.system_program.create_account(
                    solana.system_program.CreateAccountParams(
                        from_pubkey=program.provider.wallet.public_key,
                        new_account_pubkey=control.public_key,
                        lamports=control_lamports,
                        space=CONTROL_ACCOUNT_SIZE,
                        program_id=program.program_id,
                    )
                )
            ],
            signers=[control],
            options=TxOpts(
                max_retries=5,
                preflight_commitment=Finalized,
                skip_confirmation=False,
                skip_preflight=False,
            ),
        ),
    )


def compute_taker_fee(t: PerpType, /) -> float:
    if t == "future":
        return 10 / 10000
    if t == "calloption" or t == "putoption":
        return 10 / 10000
    if t == "square":
        return 15 / 10000
    raise LookupError(f"invalid perp type {t}")
