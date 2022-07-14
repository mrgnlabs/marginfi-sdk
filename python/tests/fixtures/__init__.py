from solana.publickey import PublicKey
from marginpy import Bank
from marginpy.generated_client.types import MDecimal as DecimalData, Bank as BankDecoded

SAMPLE_ACCOUNT_PUBKEY_1 = PublicKey("4HMfMtGPdbWEnTvDSWqa9c9TxgjdfsTKM2EX5GzTLKEe")
SAMPLE_ACCOUNT_PUBKEY_2 = PublicKey("Bt9DiJbRZXuSKhmxdSdn4jcApTs9xYqJhr5squkwo9H4")

MDECIMAL_ZERO = DecimalData(0, 0, 0, 0, )

SAMPLE_BANK = Bank(BankDecoded(
    MDECIMAL_ZERO,
    MDECIMAL_ZERO,
    MDECIMAL_ZERO,
    MDECIMAL_ZERO,
    MDECIMAL_ZERO,
    0,
    MDECIMAL_ZERO,
    MDECIMAL_ZERO,
    SAMPLE_ACCOUNT_PUBKEY_1,
    SAMPLE_ACCOUNT_PUBKEY_1,
    0,
    SAMPLE_ACCOUNT_PUBKEY_1,
    0,
    MDECIMAL_ZERO,
    SAMPLE_ACCOUNT_PUBKEY_1,
    0,
    MDECIMAL_ZERO,
    MDECIMAL_ZERO,
    MDECIMAL_ZERO,
    MDECIMAL_ZERO,
    MDECIMAL_ZERO,
    []
))
