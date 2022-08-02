from typing import TYPE_CHECKING

from anchorpy import AccountsCoder, Program
from marginpy.bank import Bank
from marginpy.generated_client.accounts import MarginfiGroup as MarginfiGroupDecoded
from marginpy.instructions import (
    UpdateInterestAccumulatorAccounts,
    make_update_interest_accumulator_ix,
)
from marginpy.utils.misc import load_idl
from marginpy.utils.pda import get_bank_authority
from solana.publickey import PublicKey
from solana.transaction import Transaction, TransactionInstruction, TransactionSignature

if TYPE_CHECKING:
    from marginpy.config import MarginfiConfig


class MarginfiGroup:
    _pubkey: PublicKey
    _config: "MarginfiConfig"
    _program: Program
    _admin: PublicKey
    _bank: Bank

    def __init__(
        self,
        config: "MarginfiConfig",
        program: Program,
        admin: PublicKey,
        bank: Bank,
    ) -> None:
        self._pubkey = config.group_pk
        self._config = config
        self._program = program
        self._admin = admin
        self._bank = bank

    # --- Factories

    # @todo factory fn naming can be standardized
    # right now we use `get` and `fetch` across the sdk
    # we also vary between using `init` as our factory fn and using `get/fetch``
    @staticmethod
    async def fetch(
        config: "MarginfiConfig",
        program: Program,
    ):
        """
        MarginfiGroup network factory

        Fetch account data according to the config and instantiate the corresponding MarginfiGroup.

        :param config marginfi config
        :param program marginfi Anchor program
        :returns: MarginfiGroup instance
        """

        account_data = await MarginfiGroup.__fetch_account_data(config, program)
        return MarginfiGroup(
            config, program, account_data.admin, Bank(account_data.bank)
        )

    @staticmethod
    def from_account_data(
        config: "MarginfiConfig", program: Program, account_raw: MarginfiGroupDecoded
    ):
        """
        MarginfiGroup local factory (decoded)

        Instantiate a MarginfiGroup according to the provided decoded data.
        Check sanity against provided config.

        :param config marginfi config
        :param program marginfi Anchor program
        :param account_raw Decoded marginfi group data
        :returns: MarginfiGroup instance
        """
        if not account_raw.bank.mint == config.collateral_mint_pk:
            raise Exception(
                f"Marginfi group uses collateral {account_raw.bank.mint}. Expected:"
                f" {config.collateral_mint_pk}"
            )

        return MarginfiGroup(config, program, account_raw.admin, Bank(account_raw.bank))

    @staticmethod
    def from_account_data_raw(config: "MarginfiConfig", program: Program, data: bytes):
        """
        MarginfiGroup local factory (encoded)

        Instantiate a MarginfiGroup according to the provided encoded data.
        Check sanity against provided config.

        :param config marginfi config
        :param program marginfi Anchor program
        :param data Encoded marginfi group data
        :returns: MarginfiGroup instance
        """

        account_data = MarginfiGroup.decode(data)
        return MarginfiGroup.from_account_data(config, program, account_data)

    # --- Getters and setters

    @property
    def pubkey(self) -> PublicKey:
        """marginfi group admin address"""

        return self._pubkey

    @property
    def admin(self) -> PublicKey:
        """marginfi group admin address"""

        return self._admin

    @property
    def bank(self) -> Bank:
        """marginfi group Bank"""
        return self._bank

    # --- Others

    @staticmethod
    async def __fetch_account_data(
        config: "MarginfiConfig", program: Program
    ) -> MarginfiGroupDecoded:
        """
        Fetch marginfi group account data according to the config.
        Check sanity against provided config.

        :param config marginfi config
        :param program marginfi Anchor program
        :returns: Decoded marginfi group account data struct
        """

        data = await MarginfiGroupDecoded.fetch(
            program.provider.connection,
            config.group_pk,
            program_id=config.program_id,
            commitment=program.provider.connection.commitment,
        )
        if data is None:
            raise Exception(f"Account {config.group_pk} not found")
        if data.bank.mint != config.collateral_mint_pk:
            raise Exception(
                f"Marginfi group uses collateral {data.bank.mint}. Expected:"
                f" {config.collateral_mint_pk}"
            )

        return data

    @staticmethod
    def decode(encoded: bytes) -> MarginfiGroupDecoded:
        """
        Decode marginfi group data according to the Anchor IDL.

        :param encoded: raw data buffer
        :returns: decoded marginfi group data struct
        """
        return MarginfiGroupDecoded.decode(encoded)

    @staticmethod
    def encode(decoded: MarginfiGroupDecoded) -> bytes:
        """
        Encode marginfi group data according to the Anchor IDL.

        :param decoded: decoded marginfi group data struct
        :returns: raw data buffer
        """
        coder = AccountsCoder(load_idl())
        return coder.build(decoded)

    async def reload(self):
        """Update instance data by loading the latest on-chain state."""

        group_decoded = await MarginfiGroup.__fetch_account_data(
            self._config, self._program
        )
        self._admin = group_decoded.admin
        self._bank = Bank(group_decoded.bank)

    async def make_update_interest_accumulator_ix(self) -> TransactionInstruction:
        """Create `UpdateInterestAccumulator` transaction instruction."""

        bank_authority, _ = get_bank_authority(
            self._config.group_pk, self._program.program_id
        )
        return make_update_interest_accumulator_ix(
            UpdateInterestAccumulatorAccounts(
                marginfi_group=self.pubkey,
                bank_vault=self.bank.vault,
                bank_authority=bank_authority,
                bank_fee_vault=self.bank.fee_vault,
            ),
            self._program.program_id,
        )

    async def update_interest_accumulator(self) -> TransactionSignature:
        """Update interest accumulator."""

        update_ix = await self.make_update_interest_accumulator_ix()
        tx = Transaction().add(update_ix)
        return await self._program.provider.send(tx)
