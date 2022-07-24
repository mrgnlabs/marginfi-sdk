from decimal import Decimal
import mango
from solana.publickey import PublicKey


USDC_TOKEN = mango.Token(
    "USDC",
    "USD Coin",
    Decimal(6),
    PublicKey("EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v"),
)

# class PerpMarket:
#     layout: typing.ClassVar = layouts.PERP_MARKET
#     bids_pk: PublicKey
#     asks_pk: PublicKey
#     event_queue_pk: PublicKey

#     @classmethod
#     async def fetch(
#         cls,
#         conn: AsyncClient,
#         address: PublicKey,
#         commitment: typing.Optional[Commitment] = None,
#     ) -> typing.Optional["NodeBank"]:
#         resp = await conn.get_account_info(address, commitment=commitment)
#         info = resp["result"]["value"]
#         if info is None:
#             return None
#         bytes_data = b64decode(info["data"][0])
#         return cls.decode(bytes_data)

#     @classmethod
#     def decode(cls, data: bytes) -> "NodeBank":
#         if data[:ACCOUNT_DISCRIMINATOR_SIZE] != cls.discriminator:
#             raise AccountInvalidDiscriminator(
#                 "The discriminator for this account is invalid"
#             )
#         dec = PerpMarket.layout.parse(data[ACCOUNT_DISCRIMINATOR_SIZE:])

#         return cls(
#             bids_pk=dec.bids,
#             asks_pk=dec.asks,
#             event_queue_pk=dec.event_queue,
#         )

# class NodeBank:
#     vault_pk: PublicKey
#     layout: typing.ClassVar = layouts.NODE_BANK

#     def __init__(
#         self,
#         vault_pk: PublicKey
#     ):
#         self.vault_pk = vault_pk

#     @classmethod
#     async def fetch(
#         cls,
#         conn: AsyncClient,
#         address: PublicKey,
#         commitment: typing.Optional[Commitment] = None,
#     ) -> typing.Optional["NodeBank"]:
#         resp = await conn.get_account_info(address, commitment=commitment)
#         info = resp["result"]["value"]
#         if info is None:
#             return None
#         bytes_data = b64decode(info["data"][0])
#         return cls.decode(bytes_data)

#     @classmethod
#     def decode(cls, data: bytes) -> "NodeBank":
#         if data[:ACCOUNT_DISCRIMINATOR_SIZE] != cls.discriminator:
#             raise AccountInvalidDiscriminator(
#                 "The discriminator for this account is invalid"
#             )
#         dec = NodeBank.layout.parse(data[ACCOUNT_DISCRIMINATOR_SIZE:])

#         return cls(
#             vault_pk=dec.vault
#         )


# class RootBank:
#     first_node_bank_pk: PublicKey
#     first_node_bank_vault_pk: PublicKey
#     layout: typing.ClassVar = layouts.ROOT_BANK

#     def __init__(
#         self,
#         first_node_bank_pk: PublicKey,
#         first_node_bank_vault_pk: PublicKey,
#     ):
#         self.first_node_bank_pk = first_node_bank_pk
#         self.first_node_bank_vault_pk = first_node_bank_vault_pk

#     @classmethod
#     async def fetch(
#         cls,
#         conn: AsyncClient,
#         address: PublicKey,
#         commitment: typing.Optional[Commitment] = None,
#     ) -> typing.Optional["RootBank"]:
#         resp = await conn.get_account_info(address, commitment=commitment)
#         info = resp["result"]["value"]
#         if info is None:
#             return None
#         bytes_data = b64decode(info["data"][0])
#         return await cls.decode(
#             bytes_data,
#             conn=conn,
#             commitment=commitment,
#         )

#     @classmethod
#     async def decode(
#         cls,
#         data: bytes,
#         conn: AsyncClient,
#         commitment: typing.Optional[Commitment] = None,
#     ) -> "RootBank":
#         if data[:ACCOUNT_DISCRIMINATOR_SIZE] != cls.discriminator:
#             raise AccountInvalidDiscriminator(
#                 "The discriminator for this account is invalid"
#             )
#         dec = RootBank.layout.parse(data[ACCOUNT_DISCRIMINATOR_SIZE:])

#         node_bank = await NodeBank.fetch(
#             conn=conn,
#             address=dec.node_banks[0],
#             commitment=commitment
#         )

#         return cls(
#             first_node_bank_pk=dec.node_banks[0],
#             first_node_bank_vault_pk=node_bank.vault
#         )


# class MangoGroup:
#     cache: PublicKey
#     signer: PublicKey
#     root_bank_pk: PublicKey
#     first_node_bank_pk: PublicKey
#     node_bank_vault_pk: PublicKey
#     layout: typing.ClassVar = layouts.MANGO_GROUP

#     def __init__(
#         self,
#         cache: PublicKey,
#         signer: PublicKey,
#         root_bank_pk: PublicKey,
#         first_node_bank_pk: PublicKey,
#         node_bank_vault_pk: PublicKey,
#     ) -> None:
#         self.cache = cache
#         self.signer = signer
#         self.root_bank_pk = root_bank_pk
#         self.first_node_bank_pk = first_node_bank_pk
#         self.node_bank_vault_pk = node_bank_vault_pk

#     @classmethod
#     async def fetch(
#         cls,
#         conn: AsyncClient,
#         address: PublicKey,
#         collateral_mint_pk: PublicKey,
#         commitment: typing.Optional[Commitment] = None,
#     ) -> typing.Optional["MangoGroup"]:
#         resp = await conn.get_account_info(address, commitment=commitment)
#         info = resp["result"]["value"]
#         if info is None:
#             return None
#         bytes_data = b64decode(info["data"][0])
#         return await cls.decode(bytes_data, collateral_mint_pk)

#     @classmethod
#     def _get_root_bank_pk(cls, dec, collateral_mint_pk):
#         """[Interna]"""
#         root_bank = [t for t in dec.tokens if t.token.mint == collateral_mint_pk][0]
#         return root_bank.root_bank

#     @classmethod
#     async def decode(
#         cls,
#         data: bytes,
#         collateral_mint_pk,
#         conn: AsyncClient,
#         commitment: typing.Optional[Commitment] = None,
#     ) -> "MangoGroup":
#         if data[:ACCOUNT_DISCRIMINATOR_SIZE] != cls.discriminator:
#             raise AccountInvalidDiscriminator(
#                 "The discriminator for this account is invalid"
#             )
#         dec = MangoGroup.layout.parse(data[ACCOUNT_DISCRIMINATOR_SIZE:])

#         root_bank_pk = MangoGroup._get_root_bank_pk(collateral_mint_pk)
#         root_bank = await RootBank.fetch(
#             conn=conn
#             address=root_bank_pk
#         )

#         return cls(
#             cache=dec.cache,
#             signer=dec.signer_key,
#             root_bank_pk=root_bank_pk,
#             first_node_bank_pk=root_bank.first_node_bank_pk,
#             node_bank_vault_pk=root_bank.first_node_bank_vault_pk,
#         )
