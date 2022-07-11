class MarginfiAccount:

    def all_utps(self):
        return [
            self.mango,
            self.zo
        ]
    
    def active_utps(self):
        return filter(lambda x: x.is_active, self.all_utps())
    
    @property
    def client(self):
        return self._client
    
    ###
    # @internal
    ###
    def __init__(
        self,
        marginfi_account_pk,
        authority,
        client,
        group,
        deposit_record,
        borrow_record,
        mango_utp_data,
        zo_utp_data,
    ) -> None:
        self.public_key = marginfi_account_pk
        self._client = client
        self.mango = UtpMangoAccount(client, self, mango_utp_data)
        self.zo = UtpZoaccount(client, self, zo_utp_data)
        self._authority = authority
        self._group = group
        self._depositRecord = deposit_record
        self._borrowRecord = borrow_record

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
    async def get(
        marginfi_account_pk: PublicKey,
        client: MarginfiClient
    ):
        # @todo destructuring in py

        account_data = await MarginfiAccount._fetch_account_data(
            marginfi_account_pk,
            client.config,
            client.program
        )

        marginfi_account = MarginfiAccount(
            marginfi_account_pk,
            account_data.authority,
            client,
            await MarginfiGroup.get(client.config, client.program),
            account_data.deposit_record, # @todo need to wrap in mDecimalToNative equivalent
            account_data.borrow_record, # @todo need to wrap in mDecimalToNative equivalent
            MarginfiAccount._pack_utp_data(account_data, client.config.mango.utp_index),
            MarginfiAccount._pack_utp_data(account_data, client.config.zo.utp_index)
        )

        return marginfi_account

    @property
    def _program(self):
        return self._client.program

    @property
    def _config(self):
        return self._client.config
    
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
        account_data: MarginfiAccountData,
        marginfi_group: MarginfiGroup
    ):
        if not (account_data.marginfi_group == client.config.group_pk):
            raise Exception(
                "Marginfi account tied to group {}. Expected: {}".format(
                    account_data.marginfi_group.toBase58(),
                    client.config.group_pk.toBase58()
                )
            )
        
        return MarginfiAccount(
            marginfi_account_pk,
            account_data.authority,
            client,
            marginfi_group,
            account_data.deposit_record, # @todo wrap in mDecimalToNative
            account_data.borrow_record, # @todo wrap in mDecimalToNative
            MarginfiAccount._packUtpData(account_data, client.config.mango.utp_index),
            MarginfiAccount._packUtpData(account_data, client.config.zo.utp_index)
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
        marginfi_account_raw_data, # @todo should be Buffer
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
    # Marginfi account authority address
    ###
    def authority() -> PublicKey:
        return self._authority

    ###
    # Marginfi account group address
    ###
    def group() -> MarginfiGroup:
        return self._group

    ###
    # Marginfi account deposit
    ###
    def deposit_record():
        return self._deposit_record

    ###
    # Marginfi account debt
    ###
    def borrow_record():
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
    def _fetch_account_data(
        account_address,
        config,
        program
    ):
        data = await program.account.marginfi_account.fetch(account_address)
        if not (data.marginfi_group == config.group_pk):
            return Exception(
                "Marginfi account tied to group {}. Expected: {}".format(
                    data.marginfiGroup.toBase58(),
                    config.groupPk.toBase58()
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
    def _pack_utp_data(data: MarginfiAccountData, utp_index):
        # @todo 
        return {
            account_config: data.utp_account_config[utp_index],
            is_active: data.active_utps[upt_index]
        }

    ###
    # Decode marginfi account data according to the Anchor IDL.
    #
    # @param encoded Raw data buffer
    # @returns Decoded marginfi account data struct
    ###
    @staticmethod
    def decode(encoded: Buffer) -> MarginfiAccountData:
        coder = BorshCoder(MARGINFI_IDL)
        return coder.accounts.decode(
            AccountType.MarginfiAccount,
            encoded
        )
    
    ###
    # Decode marginfi account data according to the Anchor IDL.
    #
    # @param decoded Marginfi account data struct
    # @returns Raw data buffer
    ###
    @staticmethod
    async def encode(decoded: MarginfiAccountData):
        coder = BorshCoder(MARGINFI_IDL)
        return await coder.accounts.encode(AccountType.MarginfiAccount, decoded)
    
    ###
    # Update instance data by fetching and storing the latest on-chain state.
    ###
    async def reload(self): 
        data = await MarginfiAccount._fetchAccountData(self.publicKey, self._config, self._program)
        self._group = await MarginfiGroup.get(self._config, self._program)
        self._update_from_account_data(data)
    
    ###
    # Update instance data from provided data struct.
    #
    # @param data Marginfi account data struct
    ###
    def _update_from_account_data(self, data: MarginfiAccountData):
        self._authority = data.authority
        self._deposit_record = data.deposit_record #@todo wrap in mDecimalToNative
        self._borrow_record = data.borrow_record #@todo wrap in mDecimalToNative

        self.mango.update(MarginfiAccount._packUtpData(data, self._config.mango.utpIndex))
        self.zo.update(MarginfiAccount._packUtpData(data, self._config.zo.utpIndex))
    
    ###
    # Create transaction instruction to deposit collateral into the marginfi account.
    #
    # @param amount Amount to deposit (mint native unit)
    # @returns `MarginDepositCollateral` transaction instruction
    ###
    async def make_deposit_ix(self, amount):
        # @todo associated_address is from anchorpy
        user_token_ata_pk = await associated_address({
            mint: self._group.bank.mint,
            owner: self._program.provider.wallet.publicKey,
        })
        remaining_accounts = await self.getObservationAccounts()

        return [
            await make_deposit_ix(
                self._program,
                {
                    "marginfiGroupPk": self._group.publicKey,
                    "marginfiAccountPk": self.publicKey,
                    "authorityPk": self._program.provider.wallet.publicKey,
                    "userTokenAtaPk": user_token_ata_pk,
                    "bankVaultPk": self._group.bank.vault,
                },
                { "amount": amount },
                remaining_accounts
            )
        ]
    
    ###
    # Deposit collateral into the marginfi account.
    #
    # @param amount Amount to deposit (mint native unit)
    # @returns Transaction signature
    ###
    async def deposit(self, amount):
        deposit_ix = await self.make_deposit_ix(amount);
        # tx = Transaction().add(...depositIx);
        # const sig = await processTransaction(this._program.provider, tx);
        # debug("Depositing successful %s", sig);
        # await this.reload();
        # return sig;
    