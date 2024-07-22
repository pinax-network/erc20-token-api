-- Table for balance changes --
CREATE TABLE IF NOT EXISTS balance_changes ON CLUSTER antelope  (
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


-- MV for contract --s
CREATE MATERIALIZED VIEW balance_changes_contract_historical_mv  ON CLUSTER antelope
ENGINE = ReplicatedReplacingMergeTree()
ORDER BY (contract, owner,block_num)
POPULATE
AS SELECT * FROM balance_changes;

-- MV for owner --
CREATE MATERIALIZED VIEW balance_changes_account_historical_mv ON CLUSTER antelope
ENGINE = ReplicatedReplacingMergeTree()
ORDER BY (owner, contract,block_num)
POPULATE
AS SELECT * FROM balance_changes;


CREATE TABLE IF NOT EXISTS token_holders ON CLUSTER antelope
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

CREATE MATERIALIZED VIEW token_holders_mv ON CLUSTER antelope
    TO token_holders
AS
SELECT owner as account,
       contract,
       new_balance as amount,
       block_num,
       timestamp,
       transaction_id as tx_id
FROM balance_changes;

CREATE TABLE IF NOT EXISTS account_balances ON CLUSTER antelope
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

CREATE MATERIALIZED VIEW account_balances_mv ON CLUSTER antelope
    TO account_balances
AS
SELECT owner as account,
       contract,
       amount,
       block_num, 
       timestamp,
       transaction_id as tx_id
FROM balance_changes;



CREATE TABLE IF NOT EXISTS contracts ON CLUSTER antelope  (
    contract FixedString(40),
    name        String,
    symbol      String,
    decimals    UInt64,
    block_num   UInt32(),
    timestamp   DateTime64(3, 'UTC'),
)
ENGINE = ReplicatedReplacingMergeTree PRIMARY KEY ("contract")
ORDER BY (contract);




CREATE TABLE IF NOT EXISTS supply ON CLUSTER antelope  (
    contract FixedString(40),
    supply       UInt256,
    block_num    UInt32(),
    timestamp    DateTime64(3, 'UTC'),
    version      UInt32()
)
ENGINE = ReplicatedReplacingMergeTree(version)
ORDER BY (contract,supply);


-- MV for contract --
CREATE MATERIALIZED VIEW mv_supply_contract ON CLUSTER antelope
ENGINE = ReplicatedReplacingMergeTree()
ORDER BY (contract,block_num)
POPULATE
AS SELECT * FROM supply;



CREATE TABLE IF NOT EXISTS transfers ON CLUSTER antelope (
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


-- MV for contract --
CREATE MATERIALIZED VIEW transfers_contract_historical_mv ON CLUSTER antelope
ENGINE = ReplicatedReplacingMergeTree()
ORDER BY (contract, `from`,`to`,block_num)
POPULATE
AS SELECT * FROM transfers;

-- MV for from --
CREATE MATERIALIZED VIEW transfers_from_historical_mv ON CLUSTER antelope
ENGINE = ReplicatedReplacingMergeTree()
ORDER BY (`from`, contract,block_num)
POPULATE
AS SELECT * FROM transfers;

-- MV for from --
CREATE MATERIALIZED VIEW transfers_to_historical_mv ON CLUSTER antelope
ENGINE = ReplicatedReplacingMergeTree()
ORDER BY (`to`, contract,block_num)
POPULATE
AS SELECT * FROM transfers;

