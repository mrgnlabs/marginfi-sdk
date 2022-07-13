from anchorpy import AccountsCoder
from solana.publickey import PublicKey
from solana.rpc.async_api import AsyncClient

from marginpy.generated_client.accounts import MarginfiAccount as MarginfiAccountDecoded
from marginpy.group import MarginfiGroup
from marginpy.client import MarginfiClient


class MarginfiAccount:

    ###
    # @internal
    ###
    def __init__(
        self,
        marginfi_account_pk: PublicKey,
        authority: PublicKey,
        client,
        group: MarginfiGroup,
        deposit_record,
        borrow_record,
        mango_utp_data,
        zo_utp_data,
    ) -> None:
        self.public_key = marginfi_account_pk
        self.client = client
        # self.mango = UtpMangoAccount(client, self, mango_utp_data)
        # self.zo = UtpZoaccount(client, self, zo_utp_data)
        self.authority = authority
        self.group = group
        self._deposit_record = deposit_record
        self._borrow_record = borrow_record

    def __str__(self):
        return f"Address: {self.public_key.to_base58()}\n" \
               f"Group: {self.group.public_key.to_base58()}\n" \
               f"Authority: {self.authority.to_base58()}"

    @property
    def all_utps(self):
        return [
            # self.mango,
            # self.zo
        ]

    @property
    def active_utps(self):
        filtered = filter(lambda x: x.is_active, self.all_utps)
        return list(filtered)

    # --- Factories

    ###
    # MarginfiAccount network factory
    #
    # Fetch account data according to the config and instantiate the corresponding MarginfiAccount.
    #
    # @param marginfiAccountPk Address of the target account
    # @param client marginfi client
    # @returns MarginfiAccount instance
    ###
    # @todo promises in py
    @staticmethod
    async def fetch(
        marginfi_account_pk: PublicKey,
        client: MarginfiClient
    ):
        # @todo destructuring in py

        account_data = await MarginfiAccount._fetch_account_data(
            marginfi_account_pk,
            client.config,
            client.program.provider.connection
        )

        marginfi_account = MarginfiAccount(
            marginfi_account_pk,
            account_data.authority,
            client,
            await MarginfiGroup.get(client.config, client.program),
            account_data.deposit_record, # @todo need to wrap in mDecimalToNative equivalent
            account_data.borrow_record, # @todo need to wrap in mDecimalToNative equivalent
            MarginfiAccount._pack_utp_data(account_data, 0),
            MarginfiAccount._pack_utp_data(account_data, 1)
        )

        return marginfi_account

    @property
    def _program(self):
        return self.client.program

    @property
    def _config(self):
        return self.client.config
    
    ###
    # MarginfiAccount local factory (decoded)
    #
    # Instantiate a MarginfiAccount according to the provided decoded data.
    # Check sanity against provided config.
    #
    # @param marginfiAccountPk Address of the target account
    # @param client marginfi client
    # @param accountData Decoded marginfi marginfi account data
    # @param marginfiGroup MarginfiGroup instance
    # @returns MarginfiAccount instance
    ###
    @staticmethod
    def from_account_data(
        marginfi_account_pk: PublicKey,
        client: MarginfiClient,
        account_data: MarginfiAccountDecoded,
        marginfi_group: MarginfiGroup
    ):
        if not (account_data.marginfi_group == client.config.group_pk):
            raise Exception(
                "Marginfi account tied to group {}. Expected: {}".format(
                    account_data.marginfi_group.to_base58(),
                    client.config.group_pk.to_base58()
                )
            )
        
        return MarginfiAccount(
            marginfi_account_pk,
            account_data.authority,
            client,
            marginfi_group,
            account_data.deposit_record, # @todo wrap in mDecimalToNative
            account_data.borrow_record, # @todo wrap in mDecimalToNative
            MarginfiAccount._pack_utp_data(account_data, 0),
            MarginfiAccount._pack_utp_data(account_data, 1)
        )
    
    ###
    # MarginfiAccount local factory (encoded)
    #
    # Instantiate a MarginfiAccount according to the provided encoded data.
    # Check sanity against provided config.
    #
    # @param marginfiAccountPk Address of the target account
    # @param config marginfi config
    # @param program marginfi Anchor program
    # @param marginfiAccountRawData Encoded marginfi marginfi account data
    # @param marginfiGroup MarginfiGroup instance
    # @returns MarginfiAccount instance
    ###
    @staticmethod
    def from_account_data_raw(
        marginfi_account_pk: PublicKey,
        client: MarginfiClient,
        marginfi_account_raw_data: bytes,
        marginfi_group: MarginfiGroup
    ):
        marginfi_account_data = MarginfiAccount.decode(marginfi_account_raw_data)

        return MarginfiAccount.from_account_data(
            marginfi_account_pk,
            client,
            marginfi_account_data,
            marginfi_group
        )

    # --- Getters and setters

    ###
    # Marginfi account deposit
    ###
    @property
    def deposit_record(self):
        return self._deposit_record

    ###
    # Marginfi account debt
    ###
    @property
    def borrow_record(self):
        return self._borrow_record
    
    # --- Others

    ###
    # Fetch marginfi account data.
    # Check sanity against provided config.
    #
    # @param config marginfi config
    # @param program marginfi Anchor program
    # @returns Decoded marginfi account data struct
    ###
    @staticmethod
    async def _fetch_account_data(
        account_address,
        config,
        client: AsyncClient
    ):
        data = await MarginfiAccountDecoded.fetch(client, account_address)
        if not (data.marginfi_group == config.group_pk):
            raise Exception(
                "Marginfi account tied to group {}. Expected: {}".format(
                    data.marginfi_group.to_base58(),
                    config.groupPk.to_base58()
                )
            )

        return data

    ###
    # Pack data from the on-chain, vector format into a coherent unit.
    #
    # @param data Marginfi account data
    # @param utpIndex Index of the target UTP
    # @returns UTP data struct
    ###
    @staticmethod
    def _pack_utp_data(data: MarginfiAccountDecoded, utp_index):
        # @todo 
        return {
            "account_config": data.utp_account_config[utp_index],
            "is_active": data.active_utps[utp_index]
        }

    ###
    # Decode marginfi account data according to the Anchor IDL.
    #
    # @param encoded Raw data buffer
    # @returns Decoded marginfi account data struct
    ###
    @staticmethod
    def decode(buffer: bytes) -> MarginfiAccountDecoded:
        return MarginfiAccountDecoded.decode(buffer)

    ###
    # Decode marginfi account data according to the Anchor IDL.
    #
    # @param decoded Marginfi account data struct
    # @returns Raw data buffer
    ###
    @staticmethod
    async def encode(decoded: MarginfiAccountDecoded):
        return AccountsCoder.build(decoded)

    ###
    # Update instance data by fetching and storing the latest on-chain state.
    ###
    async def reload(self): 
        data = await MarginfiAccount._fetch_account_data(self.public_key, self._config, self._program)
        self._group = await MarginfiGroup.get(self._config, self._program)
        self._update_from_account_data(data)
    
    ###
    # Update instance data from provided data struct.
    #
    # @param data Marginfi account data struct
    ###
    def _update_from_account_data(self, data: MarginfiAccountDecoded):
        self._authority = data.authority
        self._deposit_record = data.deposit_record #@todo wrap in mDecimalToNative
        self._borrow_record = data.borrow_record #@todo wrap in mDecimalToNative

        # self.mango.update(MarginfiAccount._pack_utp_data(data, self._config.mango.utpIndex))
        # self.zo.update(MarginfiAccount._pack_utp_data(data, self._config.zo.utpIndex))
    
    # ###
    # # Create transaction instruction to deposit collateral into the marginfi account.
    # #
    # # @param amount Amount to deposit (mint native unit)
    # # @returns `MarginDepositCollateral` transaction instruction
    # ###
    # async def make_deposit_ix(self, amount):
    #     # @todo associated_address is from anchorpy
    #     user_token_ata_pk = get_associated_token_address({
    #         "mint": self._group.bank.mint,
    #         "owner": self._program.provider.wallet.publicKey,
    #     })
    #     remaining_accounts = await self.getObservationAccounts()
    #
    #     return [
    #         await make_deposit_ix(
    #             self._program,
    #             {
    #                 "marginfiGroupPk": self._group.publicKey,
    #                 "marginfiAccountPk": self.publicKey,
    #                 "authorityPk": self._program.provider.wallet.publicKey,
    #                 "userTokenAtaPk": user_token_ata_pk,
    #                 "bankVaultPk": self._group.bank.vault,
    #             },
    #             { "amount": amount },
    #             remaining_accounts
    #         )
    #     ]
    #
    # ###
    # # Deposit collateral into the marginfi account.
    # #
    # # @param amount Amount to deposit (mint native unit)
    # # @returns Transaction signature
    # ###
    # async def deposit(self, amount):
    #     deposit_ix = await self.make_deposit_ix(amount);
    #     # tx = Transaction().add(...depositIx);
    #     # const sig = await processTransaction(this._program.provider, tx);
    #     # debug("Depositing successful %s", sig);
    #     # await this.reload();
    #     # return sig;
    #
