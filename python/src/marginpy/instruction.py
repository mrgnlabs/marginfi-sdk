from anchorpy import Program
from solana.publickey import PublicKey
from solana.system_program import SYS_PROGRAM_ID

# @todo no idea if this right
async def make_init_marginfi_account_ix(
    mf_program: Program,
    accounts: {
        marginfi_group_pk: PublicKey;
        marginfi_account_pk: PublicKey;
        authority_pk: PublicKey;
    }
):
    return mfProgram.methods.initMarginfiAccount().accounts({
      marginfiGroup: accounts.marginfiGroupPk,
      marginfiAccount: accounts.marginfiAccountPk,
      authority: accounts.authorityPk,
      systemProgram: SYS_PROGRAM_ID,
    }).instruction()
