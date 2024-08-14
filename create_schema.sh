#!/usr/bin/env bash

# Helper script for generating the `schema.sql` ClickHouse tables definition
# Specify a cluster name to add `ON CLUSTER` directives

show_usage() {
    printf 'Usage: %s [(-o|--outfile) file (default: "schema.sql")] [(-c|--cluster) name (default: none)] [(-h|--help)]\n' "$(basename "$0")"
    exit 0
}

SCHEMA_FILE="./schema.sql"
CLUSTER_NAME=""
while [[ "$#" -gt 0 ]]; do
    case $1 in
        -o|--outfile) SCHEMA_FILE="$2"; shift ;;
        -c|--cluster) CLUSTER_NAME="$2"; shift ;;
        -h|--help) show_usage ;;
        *) echo "Unknown parameter passed: $1"; show_usage; exit 1 ;;
    esac
    shift
done

ON_CLUSTER_DIRECTIVE=""
if [ -n "$CLUSTER_NAME" ]; then
    ON_CLUSTER_DIRECTIVE="ON CLUSTER $CLUSTER_NAME"
fi

cat > $SCHEMA_FILE <<- EOM
--------------------------------------
-- AUTO-GENERATED FILE, DO NOT EDIT --
--------------------------------------
-- This SQL file creates the required tables for a single Antelope chain.
-- You can use the ClickHouse client command to execute it:
-- $ cat schema.sql | clickhouse client -h <host> --port 9000 -d <database> -u <user> --password <password>

-------------------------------------------------
-- Meta tables to store Substreams information --
-------------------------------------------------

-------------------------------------------------
-- Meta tables to store Substreams information --
-------------------------------------------------

CREATE TABLE IF NOT EXISTS cursors 
(
    id        String,
    cursor    String,
    block_num Int64,
    block_id  String
)
    ENGINE = ReplicatedReplacingMergeTree()
        PRIMARY KEY (id)
        ORDER BY (id);



-------------------------------------------------
-- -- Table for all balance changes event --
-------------------------------------------------

CREATE TABLE IF NOT EXISTS balance_changes   (
    "id"            String,
    timestamp       DateTime64(3, 'UTC'),
    contract        FixedString(40),
    owner           FixedString(40),
    amount          UInt256,
    old_balance     UInt256,
    new_balance     UInt256,
    transaction_id  FixedString(64),
    block_num    UInt32(),
    change_type     Int32
)
ENGINE = ReplicatedMergeTree PRIMARY KEY ("id")
ORDER BY (id,timestamp, block_num);


------------------------------------------------------------------------------
-- -- MV for historical balance changes event order by contract address   --
------------------------------------------------------------------------------

CREATE MATERIALIZED VIEW balance_changes_contract_historical_mv  
ENGINE = ReplicatedReplacingMergeTree()
ORDER BY (contract, owner,block_num)
POPULATE
AS SELECT * FROM balance_changes;

------------------------------------------------------------------------------
-- -- MV for historical balance changes event order by account address   --
------------------------------------------------------------------------------
CREATE MATERIALIZED VIEW balance_changes_account_historical_mv 
ENGINE = ReplicatedReplacingMergeTree()
ORDER BY (owner, contract,block_num)
POPULATE
AS SELECT * FROM balance_changes;


-------------------------------------------
-- -- MV for latest token_holders   --
-------------------------------------------
CREATE TABLE IF NOT EXISTS token_holders 
(
    account              FixedString(40),
    contract             String,
    amount               UInt256,
    block_num            UInt32(),
    timestamp            DateTime64(3, 'UTC'),
    tx_id                FixedString(64)
)
    ENGINE = ReplicatedReplacingMergeTree(block_num)
        PRIMARY KEY (contract,account)
        ORDER BY (contract, account);

CREATE MATERIALIZED VIEW token_holders_mv 
    TO token_holders
AS
SELECT owner as account,
       contract,
       new_balance as amount,
       block_num,
       timestamp,
       transaction_id as tx_id
FROM balance_changes;



-------------------------------------------
--  MV for account balances   --
-------------------------------------------
CREATE TABLE IF NOT EXISTS account_balances 
(
    account              FixedString(40),
    contract             String,
    amount               UInt256,
    block_num            UInt32(),
    timestamp            DateTime64(3, 'UTC'),
    tx_id                FixedString(64)
)
    ENGINE = ReplicatedReplacingMergeTree(block_num)
        PRIMARY KEY (account,contract)
        ORDER BY (account,contract);

CREATE MATERIALIZED VIEW account_balances_mv 
    TO account_balances
AS
SELECT owner as account,
       contract,
       amount,
       block_num, 
       timestamp,
       transaction_id as tx_id
FROM balance_changes;


-------------------------------------------------
--  Table for all token information --
-------------------------------------------------
CREATE TABLE IF NOT EXISTS contracts   (
    contract FixedString(40),
    name        String,
    symbol      String,
    decimals    UInt64,
    block_num   UInt32(),
    timestamp   DateTime64(3, 'UTC'),
)
ENGINE = ReplicatedReplacingMergeTree PRIMARY KEY ("contract")
ORDER BY (contract);




-------------------------------------------------
--  Table for  token supply  --
-------------------------------------------------
CREATE TABLE IF NOT EXISTS supply   (
    contract FixedString(40),
    supply       UInt256,
    block_num    UInt32(),
    timestamp    DateTime64(3, 'UTC'),
)
ENGINE = ReplicatedReplacingMergeTree()
ORDER BY (contract,block_num);


-------------------------------------------------
--  table for all transfers events  --
-------------------------------------------------
CREATE TABLE IF NOT EXISTS transfers  (
    id String,
    contract FixedString(40),
    `from` String,
    `to` String,
    value String,
    tx_id String,
    action_index UInt32,
    block_num UInt32,
    timestamp DateTime64(3, 'UTC')
)
ENGINE = ReplicatedMergeTree
PRIMARY KEY (id)
ORDER BY (id, tx_id, block_num, timestamp);


-------------------------------------------------
--  MV for historical transfers events by contract address --
-------------------------------------------------
CREATE MATERIALIZED VIEW transfers_contract_historical_mv 
ENGINE = ReplicatedReplacingMergeTree()
ORDER BY (contract, `from`,`to`,block_num)
POPULATE
AS SELECT * FROM transfers;

-------------------------------------------------
--  MV for historical transfers events by from address --
-------------------------------------------------
CREATE MATERIALIZED VIEW transfers_from_historical_mv 
ENGINE = ReplicatedReplacingMergeTree()
ORDER BY (`from`, contract,block_num)
POPULATE
AS SELECT * FROM transfers;

-------------------------------------------------
--  MV for historical transfers events by to address --
-------------------------------------------------
CREATE MATERIALIZED VIEW transfers_to_historical_mv 
ENGINE = ReplicatedReplacingMergeTree()
ORDER BY (`to`, contract,block_num)
POPULATE
AS SELECT * FROM transfers;


EOM

echo "[+] Created '$SCHEMA_FILE'"
echo "[*] Run the following command to apply:"
echo "cat $SCHEMA_FILE | clickhouse client -h <host> --port 9000 -d <database> -u <user> --password <password>"