from anchorpy import Program
from solana.publickey import PublicKey

from config import MarginfiConfig

class MarginfiGroup:

    def __init__(
        self,
        config: MarginfiConfig,
        program: Program,
        admin: PublicKey,
        bank: Bank,
    ) -> None:
        self.public_key = config.group_pk
        self._config = config
        self._program = program
        self._admin = admin
        self._bank = bank

    # --- Factories

    ###
    # MarginfiGroup network factory
    #
    # Fetch account data according to the config and instantiate the corresponding MarginfiGroup.
    #
    # @param config marginfi config
    # @param program marginfi Anchor program
    # @return MarginfiGroup instance
    ###
    @staticmethod
    async def get(
        config: MarginfiConfig,
        program: Program,
    ):
        account_data = await MarginfiGroup.__fetch_account_data(config, program)
        
        return MarginfiGroup(
            config,
            program,
            account_data.admin,
            # @todo `from` doesn't work here bc python
            Bank._from(account_data.bank)
        )

    ###
    # MarginfiGroup local factory (decoded)
    #
    # Instantiate a MarginfiGroup according to the provided decoded data.
    # Check sanity against provided config.
    #
    # @param config marginfi config
    # @param program marginfi Anchor program
    # @param accountData Decoded marginfi group data
    # @return MarginfiGroup instance
    ###
    @staticmethod
    def from_account_data(
        config: MarginfiConfig,
        program: Program,
        account_data: MarginfiGroupData
    ):
        if not (account_data.bank.mint == config.collateral_mint_pk):
            raise Exception(
                "Marginfi group uses collateral {}. Expected: {}".format(
                    account_data.bank.mint.toBase58(),
                    config.collateral_mint_pk.toBase58()
                )
            )
        
        return MarginfiGroup(
            config,
            program,
            account_data.admin,
            Bank._from(
                account_data.bank
            )
        )

    ###
    # MarginfiGroup local factory (encoded)
    #
    # Instantiate a MarginfiGroup according to the provided encoded data.
    # Check sanity against provided config.
    #
    # @param config marginfi config
    # @param program marginfi Anchor program
    # @param data Encoded marginfi group data
    # @return MarginfiGroup instance
    ###
    @staticmethod
    def from_account_data_raw(
        config: MarginfiConfig,
        program: Program,
        rawData #@todo figure out what `Buffer` python type is
    ):
        data = MarginfiGroup.decode(rawData)
        return MarginfiGroup.from_account_data(config, program, data)
    
    # --- Getters and setters

    ###
    # marginfi group admin address
    ###
    @property
    def admin(self) -> PublicKey:
        return self._admin

    ###
    # marginfi group Bank
    ###
    @property
    def bank(self) -> Bank:
        return self._bank
    
    # --- Others

    ###
    # Fetch marginfi group account data according to the config.
    # Check sanity against provided config.
    #
    # @param config marginfi config
    # @param program marginfi Anchor program
    # @return Decoded marginfi group account data struct
    ###
    @staticmethod
    async def __fetch_account_data(
        config: MarginfiConfig,
        program: Program
    ) -> MarginfiGroupData:
        # @todo this will need to be rewritten
        data = await program.account.marginfi_group.fetch(config.group_pk)

        if not (data.bank.mint == config.collateral_mint_pk):
            raise Exception(
                "Marginfi group uses collateral {}. Expected: {}".format(
                    data.bank.mint.toBase58(),
                    config.collateralMintPk.toBase58()
                )
            )

        return data

    ###
    # Decode marginfi group account data according to the Anchor IDL.
    #
    # @param encoded Raw data buffer
    # @return Decoded marginfi group account data struct
    ###
    @staticmethod
    def decode(
        encoded #@todo figure out Buffer type in python
    ) -> MarginfiGroupData:
        #@todo no BorshCoder
        coder = BorshCoder(MARGINFI_IDL)
        return coder.accounts.decode(
            AccountType.MarginfiGroup, encoded
        )
  
    ###
    # Encode marginfi group account data according to the Anchor IDL.
    #
    # @param decoded Encoded marginfi group account data buffer
    # @return Raw data buffer
    ###
    @staticmethod
    async def encode(
        decoded: MarginfiGroupData
    ):
        coder = BorshCoder(MARGINFI_IDL);
        return await coder.accounts.encode(
            AccountType.MarginfiGroup, decoded
        )
  
    ###
    # Update instance data by fetching and storing the latest on-chain state.
    ###
    async def fetch(self):
        data = await MarginfiGroup._fetchAccountData(self._config, self._program)
        self._admin = data.admin
        self._bank = Bank._from(data.bank) #@todo fix Bank `from` issue

    ###
    # Create `UpdateInterestAccumulator` transaction instruction.
    ###
    async def make_update_interest_accumulator_ix(self):
        bank_authority, _ = await get_bank_authority(
            self._config.group_pk,
            self._program.program_id,
        )
        # @todo this pattern was pretty confusing
        return make_update_interest_accumulator_ix(
            self._program,
            {
                "marginfiGroupPk": self.public_key,
                "bankVault": self.bank.vault,
                "bankAuthority": bank_authority,
                "bankFeeVault": self.bank.fee_vault,
            }
        )
    
    ###
    # Update interest accumulator.
    ###
    async def update_interest_accumulator():
        tx = Transaction().add(
            await self.make_update_interest_accumulator_ix()
        )
        return await process_transaction(
            self._program.provider, tx
        )
