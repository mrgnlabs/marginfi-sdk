import { MangoClient } from "@blockworks-foundation/mango-client";
import { AccountMeta } from "@solana/web3.js";
import { MarginfiClient } from "../..";
import MarginfiAccount from "../../account";
import { InstructionsWrapper, UiAmount, UtpData } from "../../types";
import UtpAccount from "../account";
import { UtpObservation } from "../observation";

/**
 * Class encapsulating Mango-specific interactions (internal)
 */
export class UtpMangoAccount extends UtpAccount {
  /** @internal */
  constructor(client: MarginfiClient, marginfiAccount: MarginfiAccount, accountData: UtpData) {
    super(client, marginfiAccount, accountData.isActive, accountData.accountConfig);
  }

  // --- Getters / Setters

  /**
   * UTP-specific config
   */
  public get config() {
    return this._config.mango;
  }

  /**
   * Create transaction instruction to deactivate Mango.
   *
   * @returns `DeactivateUtp` transaction instruction
   */
  async makeDeactivateIx(): Promise<InstructionsWrapper> {
    return this._marginfiAccount.makeDeactivateUtpIx(this.index);
  }

  /**
   * Deactivate UTP.
   *
   * @returns Transaction signature
   */
  async deactivate() {
    const debug = require("debug")(`mfi:utp:${this.address}:mango:deactivate`);
    debug("Deactivating Mango UTP");
    const sig = await this._marginfiAccount.deactivateUtp(this.index);
    debug("Sig %s", sig);
    await this._marginfiAccount.reload(); // Required to update the internal UTP address
    return sig;
  }

  /**
   * Deposit collateral into the Mango account.
   *
   * Method is not supported for Mango UTP anymore.
   *
   * @param amount Amount to deposit (mint native unit)
   * @returns Transaction signature
   */
  deposit(_amount: UiAmount): Promise<string> {
    throw new Error("Method not implemented.");
  }

  /**
   * Withdraw from the Mango account to the marginfi account.
   *
   * Method is not supported for Mango UTP anymore.
   *
   * @param amount Amount to deposit (mint native unit)
   * @returns Transaction signature
   */
  withdraw(_amount: UiAmount, _includeObservationAccounts: boolean = false): Promise<string> {
    throw new Error("Method not implemented.");
  }

  /**
   * Create list of account metas required to observe a Mango account.
   *
   * @returns `AccountMeta[]` list of account metas
   */
  async getObservationAccounts(): Promise<AccountMeta[]> {
    return [];
  }

  /**
   * Refresh and retrieve the health cache for the Mango account, directly from the mango account.
   *
   * @returns Health cache for the Mango UTP
   */
  async observe(): Promise<UtpObservation> {
    console.warn("Mango UTP is not supported anymore.");
    return UtpObservation.EMPTY_OBSERVATION;
  }

  getMangoClient(): MangoClient {
    return new MangoClient(this._client.program.provider.connection, this._client.config.mango.programId);
  }
}
