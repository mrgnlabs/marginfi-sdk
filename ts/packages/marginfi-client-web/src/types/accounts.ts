import { BN } from "@project-serum/anchor";
import { PublicKey } from "@solana/web3.js";
import { BankData, MDecimalRaw, UTPAccountConfig } from ".";

export enum AccountType {
  MarginfiGroup = "marginfiGroup",
  MarginfiAccount = "marginfiAccount",
}

export interface MarginfiGroupData {
  admin: PublicKey;
  bank: BankData;
  reservedSpace: BN[];
}

export interface MarginfiAccountData {
  authority: PublicKey;
  marginfiGroup: PublicKey;
  depositRecord: MDecimalRaw;
  borrowRecord: MDecimalRaw;
  activeUtps: boolean[];
  utpAccountConfig: UTPAccountConfig[];
  reservedSpace: BN[];
}
