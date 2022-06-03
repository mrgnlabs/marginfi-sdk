import * as DriftSDK from "@drift-labs/sdk";
import { initialize } from "@drift-labs/sdk/lib/config";
import DriftIdl from "@drift-labs/sdk/src/idl/clearing_house.json";
import { Wallet } from "@mrgnlabs/marginfi-client";
import { Idl, Program, Provider } from "@project-serum/anchor";
import { Connection, Keypair, PublicKey } from "@solana/web3.js";
import { writeFileSync } from "fs";

const driftConfig = initialize({ env: "mainnet-beta" });
const driftProgramId = new PublicKey(driftConfig.CLEARING_HOUSE_PROGRAM_ID);
const connection = new Connection(process.env.RPC_ENDPOINT!);
const wallet = new Wallet(Keypair.generate());
const provider = new Provider(connection, wallet, {});
const driftProgram: Program<Idl> = new Program(DriftIdl as Idl, driftProgramId, provider);

(async function () {
  const clearingHouseStatePk = await DriftSDK.getClearingHouseStateAccountPublicKey(driftProgramId);

  // const driftClearingHouseState: StateAccount =
  //   (await this._driftProgram.account.state.fetch(
  //     clearingHouseStatePk
  //   )) as any;

  const userPk = new PublicKey("2oMMnFauxTKsq9ZDQfUnTENYDL2Zz9NaV2at4vdeMJfc");
  const utpMarginAccount = await driftProgram.account.user.fetch(userPk);
  const state = await driftProgram.account.state.fetch(clearingHouseStatePk);

  const positionsPk = utpMarginAccount.positions;
  const marketsPk = state.markets;

  const stateAi = await connection.getAccountInfo(clearingHouseStatePk);
  const userAi = await connection.getAccountInfo(userPk);
  const userPositionsAi = await connection.getAccountInfo(positionsPk);
  const marketsAi = await connection.getAccountInfo(marketsPk);

  writeFileSync(`drift-state-${clearingHouseStatePk.toString()}`, stateAi!.data);
  writeFileSync(`drift-user-${userPk.toString()}`, userAi!.data);
  writeFileSync(`drift-user-positions-${positionsPk.toString()}`, userPositionsAi!.data);
  writeFileSync(`drift-markets-${marketsPk.toString()}`, marketsAi!.data);
})();
