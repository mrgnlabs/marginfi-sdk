from typing import List
from marginpy import MarginfiClient, MarginfiAccount
from marginpy.utp.account import UtpAccount
from marginpy.types import UtpData
from solana.transaction import (
    AccountMeta,
    TransactionInstruction,
    Transaction,
    TransactionSignature,
)
from marginpy.utp.mango.instruction import (
    make_activate_ix,
    ActivateArgs,
    ActivateAccounts,
    make_deposit_ix,
    DepositArgs,
    DepositAccounts,
    make_withdraw_ix,
    WithdrawArgs,
    WithdrawAccounts,
    make_place_perp_order_ix,
    PlacePerpOrderArgs,
    PlacePerpOrderAccounts,
    make_cancel_perp_order_ix,
    CancelPerpOrderArgs,
    CancelPerpOrderAccounts,
)


class UtpMangoAccount(UtpAccount):
    """[Internal] Class encapsulating Mango-specific interactions"""
    client: MarginfiClient
    marginfi_account: MarginfiAccount
    is_active: bool
    account_config: UtpData

    def __init__(
        self,
        client: MarginfiClient,
        marginfi_account: MarginfiAccount,
        account_data: UtpData
    ):
        """[Internal]"""
        #@todo confirm this
        self._client = client
        self._marginfi_account = marginfi_account
        self.is_active = account_data.is_active
        self.account_config = account_data.account_config

    # --- Getters / Setters

    @property
    def config(self):
        return self._config.mango

    # --- Others

    def make_activate_ix(self) -> TransactionInstruction:
        """
        Create transaction instruction to activate Mango.
        
        :returns: `ActivateUtp` transaction instruction
        """
        #     const authoritySeed = Keypair.generate();

        #     const [mangoAuthorityPk, mangAuthorityBump] = await this.authority(authoritySeed.publicKey);
        #     const [mangoAccountPk] = await getMangoAccountPda(
        #     this._config.mango.groupConfig.publicKey,
        #     mangoAuthorityPk,
        #     new BN(0),
        #     this._config.mango.programId
        #     );

        return make_activate_ix(
            ActivateArgs(
                authority_seed=authority_seed.public_key
                authority_bump: int
            ),
            ActivateAccounts(
                marginfi_account=self._marginfi_account.pubkey
                marginfi_group=self._marginfi_account.group.pubkey
                authority: PublicKey
                mango_authority: PublicKey
                mango_account: PublicKey
                mango_program=self.account_data.account_config.program_id,
                mango_group=self.account_data.account_config.group_pk
            ),
            self._client.program_id,
        )

    async def activate(self) -> TransactionSignature:
        """
        Activate Mango.
        
        :returns: Transaction signature
        """

        activate_ix = self.activate_ix()
        tx = Transaction().add(activate_ix)
        return await self._client.program.provider.send(tx)

    # @todo check deactivate fns
    def make_deactivate_ix(self) -> TransactionInstruction:
        """
        Create transaction instruction to deactivate Mango.
        
        :returns: `DeactivateUtp` transaction instruction
        """
        return self._marginfi_account.make_deactivate_utp_ix(self.index)

    async def deactivate(self) -> TransactionSignature:
        """
        Deactivate UTP.
        
        :returns: Transaction signature
        """

        deactivate_ix = self.make_deactivate_ix()
        tx = Transaction().add(deactivate_ix)
        return await self._client.program.provider.send(tx)

    # @todo general note: amounts should be ints not floats
    def make_deposit_ix(self, amount: int) -> TransactionInstruction:
        """
        Create transaction instruction to deposit collateral into the Mango account.
        
        :param amount Amount to deposit (mint native unit)
        :returns `MangoDepositCollateral` transaction instruction
        """

        remaining_accounts = self.get_observation_accounts()

        return make_deposit_ix(
            args=DepositArgs(amount),
            accounts=DepositAccounts(
                marginfi_account: PublicKey
                marginfi_group: PublicKey
                signer: PublicKey
                margin_collateral_vault: PublicKey
                bank_authority: PublicKey
                temp_collateral_account: PublicKey
                mango_authority: PublicKey
                mango_account: PublicKey
                mango_program: PublicKey #@todo pass through mango config
                mango_group: PublicKey
                mango_cache: PublicKey
                mango_root_bank: PublicKey
                mango_node_bank: PublicKey
                mango_vault: PublicKey
            ),
            self._client.program_id,
            remaining_accounts,
        )

    async def deposit(self, amount: int) -> TransactionSignature:
        """
        Deposit collateral into the Mango account.
        
        :param amount Amount to deposit (mint native unit)
        :returns" Transaction signature
        """

        deposit_ix = self.make_deposit_ix(amount)
        tx = Transaction().add(deposit_ix)
        return await self._client.program.provider.send(tx)

    def make_withdraw_ix(self, amount: int) -> TransactionInstruction:
        """
        Create transaction instruction to withdraw from the Mango account to the marginfi account.
        
        :param amount Amount to deposit (mint native unit)
        :returns: `MangoWithdrawCollateral` transaction instruction
        """
        
        remaining_accounts = self.get_observation_accounts()

        return make_withdraw_ix(
            WithdrawArgs(amount),
            WithdrawAccounts(

            ),
            self._client.program_id,
            remaining_accounts,
        )

    async def withdraw(self, amount: int) -> TransactionSignature:
        """
        Withdraw from the Mango account to the marginfi account.
        
        :param amount Amount to deposit (mint native unit)
        :returns: Transaction signature
        """

        withdraw_ix = self.make_withdraw_ix()
        tx = Transaction().add(withdraw_ix)
        return await self._client.program.provider.send(tx)

    async def get_observation_accounts(self) -> List[AccountMeta]:
        """
        Create list of account metas required to observe a Mango account.
        
        :returns: `AccountMeta[]` list of account metas
        """
        pass # TODO

    def make_place_perp_order_ix(self) -> TransactionInstruction:
        """
        Create transaction instruction to place a perp order.
        
        :returns: `MangoPlacePerpOrder` transaction instruction
        """
        
        remaining_accounts = self.get_observation_accounts()

        return make_place_perp_order_ix(
            PlacePerpOrderArgs(
                
            ),
            PlacePerpOrderAccounts(

            ),
            self._client.program_id,
            remaining_accounts,
        )

    async def place_perp_order(self):
        """
        Place a perp order.
        
        :returns: Transaction signature
        """
        place_perp_order_ix = self.make_place_perp_order_ix()
        tx = Transaction().add(place_perp_order_ix)
        return await self._client.program.provider.send(tx)

    def make_cancel_perp_order_ix(self):
        """
        Create transaction instruction to cancel a perp order.
        
        :returns: `MangoCancelPerpOrder` transaction instruction
        """

        remaining_accounts = self.get_observation_accounts()

        return make_cancel_perp_order_ix(
            CancelPerpOrderArgs(

            ),
            CancelPerpOrderAccounts(

            ),
            self._client.program_id,
            remaining_accounts,
        )

    async def cancel_perp_order(self):
        """
        Cancel a perp order.
        
        :returns: Transaction signature
        """

        cancel_perp_order_ix = self.make_cancel_perp_order_ix()
        tx = Transaction().add(cancel_perp_order_ix)
        return await self._client.program.provider.send(tx)

    def verify_active(self):
        """[Internal]"""
        # private verifyActive() {
        #     const debug = require("debug")(`mfi:utp:${this.address}:mango:verify-active`);
        #     if (!this.isActive) {
        #     debug("Utp isn't active");
        #     throw new Error("Utp isn't active");
        #     }
        # }
        pass

    async def compute_utp_account_address(self):
        """[Internal]"""
        # async computeUtpAccountAddress(accountNumber: BN = new BN(0)) {
        #     const [utpAuthorityPk] = await this.authority();
        #     const [utpAccountPk] = await getMangoAccountPda(
        #     this._config.mango.groupConfig.publicKey,
        #     utpAuthorityPk,
        #     accountNumber,
        #     this._config.mango.programId
        #     );
        #     return utpAccountPk;
        # }
        pass

    async def observe(self):
        """
        Refresh and retrieve the health cache for the Mango account, directly from the mango account.
        
        :returns: Health cache for the Mango UTP
        """
        pass

    def get_mango_client(self):
        # getMangoClient(): MangoClient {
        #     return new MangoClient(this._client.program.provider.connection, this._client.config.mango.programId);
        # }
        pass

    async def get_mango_account(self):
        # async getMangoAccount(mangoGroup?: MangoGroup): Promise<MangoAccount> {
        #     if (!mangoGroup) {
        #     mangoGroup = await this.getMangoGroup();
        #     }

        #     const mangoClient = this.getMangoClient();
        #     const mangoAccount = await mangoClient.getMangoAccount(this.address, mangoGroup.dexProgramId);

        #     return mangoAccount;
        # }

        # async getMangoGroup(): Promise<MangoGroup> {
        #     const mangoClient = this.getMangoClient();
        #     return mangoClient.getMangoGroup(this._config.mango.groupConfig.publicKey);
        # }
        # }
        pass

async def get_mango_account_pda():
    """[Internal] Compute the Mango account PDA tied to the specified user."""
    # export async function getMangoAccountPda(
    #     mangoGroupPk: PublicKey,
    #     authority: PublicKey,
    #     accountNumber: BN,
    #     programId: PublicKey
    #     ): Promise<[PublicKey, number]> {
    #     return PublicKey.findProgramAddress(
    #         [mangoGroupPk.toBytes(), authority.toBytes(), new BN(accountNumber).toBuffer("le", 8)],
    #         programId
    #     );
    # }
    pass
