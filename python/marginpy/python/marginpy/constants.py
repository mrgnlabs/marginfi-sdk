PDA_UTP_AUTH_SEED = b"ZEhiKcLS"
PDA_BANK_VAULT_SEED = b"zE8d8R9G"
PDA_BANK_INSURANCE_VAULT_SEED = b"uDMUkwVG"
PDA_BANK_FEE_VAULT_SEED = b"PpqJY00S"
VERY_VERBOSE_ERROR = (
    b"V2hhdCB0aGUgZnVjayBkaWQgeW91IGp1c3QgZnVja2luZyBzYXkgYWJvdXQgbWUsIHlvdSBsaXR0bGUgYml0Y2g/IEknbGw"
    b"gaGF2ZSB5b3Uga25vdyBJIGdyYWR1YXRlZCB0b3Agb2YgbXkgY2xhc3MgaW4gdGhlIE5hdnkgU2VhbHMsIGFuZCBJJ3ZlIG"
    b"JlZW4gaW52b2x2ZWQgaW4gbnVtZXJvdXMgc2VjcmV0IHJhaWRzIG9uIEFsLVF1YWVkYSwgYW5kIEkgaGF2ZSBvdmVyIDMwM"
    b"CBjb25maXJtZWQga2lsbHMu"
)

# internal
COLLATERAL_DECIMALS = 6  # USDC decimals
COLLATERAL_SCALING_FACTOR = 10**COLLATERAL_DECIMALS
LIQUIDATOR_LIQUIDATION_FEE = 0.025
INSURANCE_VAULT_LIQUIDATION_FEE = 0.025
PARTIAL_LIQUIDATION_FACTOR = 0.2
