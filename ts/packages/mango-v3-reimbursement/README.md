Flow

- Write to table
- Create group
- Create vaults
- Token Transfer to vaults outside the context of the program
- UI creates Reimbursement account
- UI packs tx with ixs which contain
  - create token account OR a create idempotent ATA
  - reimburse to above token account OR ATA

# mango-v3-reimbursement

This repository contains code that allows users of mango v3 to receive re-imbursement after the emergency shutdown in Slot 154,889,307.

## Deployment

First calculate the re-imbursement from a recent solana snapshot, we used Slot 154,856,403:

- download the [solana snapshot](https://drive.google.com/file/d/1nYJjW0n2pSpAOwf7kUR_p-Cj2PpS3kcn/view?usp=sharing)
- download the [deposits & withdrawals](https://docs.google.com/spreadsheets/d/1DwtllQeCw3j9-DjNFgxSk_Gl_L8405W9ExjeqvKVjds/edit#gid=0) since snapshot as tsv
- compile [PR #208 on mango-v3](https://github.com/blockworks-foundation/mango-v3/pull/208) and the following two commands to generate a csv as well as a binary buffer

```
cargo run --bin cli equity-from-snapshot \
--snapshot snapshot-154856403-HJj8oytGGRnbUoFdojewzBWB3FrTBaTJdx1v4g63oUWc.sqlite \
--late-changes deposits_withdraws.tsv \
--program mv3ekLzLbnVPNxjSKvqBpU3ZeZXPQdEC3bp5MDEBG68 \
--group 98pjRuQjK3qA6gXts96PqZT4Ze5QmnCmt3QYjhbUSPue \
--outtype csv --outfile reimbursement.csv

cargo run --bin cli equity-from-snapshot \
--snapshot snapshot-154856403-HJj8oytGGRnbUoFdojewzBWB3FrTBaTJdx1v4g63oUWc.sqlite \
--late-changes deposits_withdraws.tsv \
--program mv3ekLzLbnVPNxjSKvqBpU3ZeZXPQdEC3bp5MDEBG68 \
--group 98pjRuQjK3qA6gXts96PqZT4Ze5QmnCmt3QYjhbUSPue \
--outtype bin --outfile reimbursement.bin
```
