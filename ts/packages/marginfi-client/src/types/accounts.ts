import { BN } from "@project-serum/anchor";
import { PublicKey } from "@solana/web3.js";
import { BankData, MDecimalRaw, UTPAccountConfig } from ".";

export enum AccountType {
  MarginfiGroup = "marginGroup",
  MarginAccount = "marginAccount",
}

export interface MarginfiGroupData {
  admin: PublicKey;
  bank: BankData;
  reservedSpace: BN[];
}

export interface MarginAccountData {
  authority: PublicKey;
  marginGroup: PublicKey;
  depositRecord: MDecimalRaw;
  borrowRecord: MDecimalRaw;
  activeUtps: boolean[];
  utpAccountConfig: UTPAccountConfig[];
  reservedSpace: BN[];
}
