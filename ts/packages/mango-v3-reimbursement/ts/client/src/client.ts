import { Program, ProgramAccount, Provider } from "@project-serum/anchor";
import { PublicKey } from "@solana/web3.js";
import { MangoV3Reimbursement, IDL } from "./mango_v3_reimbursement";

export const ID = new PublicKey("m3roABq4Ta3sGyFRLdY4LH1KN16zBtg586gJ3UxoBzb");

export class MangoV3ReimbursementClient {
  public program: Program<MangoV3Reimbursement>;
  constructor(provider: Provider) {
    this.program = new Program<MangoV3Reimbursement>(
      IDL as MangoV3Reimbursement,
      ID,
      provider
    );
  }

  public async decodeTable(group) {
    const ai = await this.program.provider.connection.getAccountInfo(
      group.table
    );

    if (!ai) {
      throw new Error(`Table ai cannot be undefined!`);
    }

    const rowSize = (this.program as any)._coder.types.typeLayouts.get(
      "Row"
    ).span;
    const tableHeaderSize = 40;
    const rows = (ai.data.length - tableHeaderSize) / rowSize;
    return [...Array(rows).keys()].map((i) => {
      const start = tableHeaderSize + i * rowSize;
      const end = start + rowSize;
      return (this.program as any)._coder.types.typeLayouts
        .get("Row")
        .decode(ai.data.subarray(start, end));
    });
  }

  public reimbursed(reimbursementAccount, tokenIndex): boolean {
    return (reimbursementAccount.reimbursed & (1 << tokenIndex)) !== 0;
  }

  public calimTransferred(reimbursementAccount, tokenIndex): boolean {
    return (reimbursementAccount.calimTransferred & (1 << tokenIndex)) !== 0;
  }
}
