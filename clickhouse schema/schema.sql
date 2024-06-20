-- Table for balance changes --
CREATE TABLE IF NOT EXISTS balance_changes  (
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
ENGINE = MergeTree PRIMARY KEY ("id")
ORDER BY (id,timestamp, block_num);

-- MV for contract --s
CREATE MATERIALIZED VIEW balance_changes_contract_historical_mv
ENGINE = MergeTree()
ORDER BY (contract, owner)
POPULATE
AS SELECT * FROM balance_changes;

-- MV for owner --
CREATE MATERIALIZED VIEW balance_changes_account_historical_mv
ENGINE = MergeTree()
ORDER BY (owner, contract)
POPULATE
AS SELECT * FROM balance_changes;


CREATE TABLE IF NOT EXISTS token_holders
(
    account              String,
    contract             String,
    amount               Int64,
    block_num            UInt64,
    timestamp            DateTime,
    is_deleted           UInt8
)
    ENGINE = ReplacingMergeTree(block_num, is_deleted)
        PRIMARY KEY (contract,account)
        ORDER BY (contract, account);

CREATE MATERIALIZED VIEW token_holders_mv
    TO token_holders
AS
SELECT owner as account,
       contract,
       amount,
       block_num            AS updated_at_block_num,
       timestamp            AS updated_at_timestamp,
       if(amount > 0, 0, 1) AS is_deleted
FROM balance_changes;

CREATE TABLE IF NOT EXISTS account_balances
(
    account              String,
    contract             String,
    amount               Int64,
    block_num            UInt32,
    is_deleted           UInt8
)
    ENGINE = ReplacingMergeTree(block_num, is_deleted)
        PRIMARY KEY (account,contract)
        ORDER BY (account,contract);

CREATE MATERIALIZED VIEW account_balances_mv
    TO account_balances
AS
SELECT owner as account,
       contract,
       amount,
       block_num            AS updated_at_block_num,
       timestamp            AS updated_at_timestamp,
       if(amount > 0, 0, 1) AS is_deleted
FROM balance_changes;



CREATE TABLE IF NOT EXISTS contracts  (
    contract FixedString(40),
    name        String,
    symbol      String,
    decimals    UInt64,
    block_num   UInt32(),
    timestamp   DateTime64(3, 'UTC'),
)
ENGINE = MergeTree PRIMARY KEY ("contract")
ORDER BY (contract, name);




CREATE TABLE IF NOT EXISTS supply  (
    contract FixedString(40),
    supply       UInt256,
    block_num    UInt32(),
    timestamp    DateTime64(3, 'UTC'),
    version      UInt32()
)
ENGINE = ReplacingMergeTree(version)
ORDER BY (contract,supply);

-- Indexes for block_number and chain --
ALTER TABLE supply ADD INDEX supply_block_number_index block_num TYPE minmax;

-- MV for contract --
CREATE MATERIALIZED VIEW mv_supply_contract
ENGINE = MergeTree()
ORDER BY (contract,block_num)
POPULATE
AS SELECT * FROM supply;



CREATE TABLE IF NOT EXISTS transfers  (
    contract FixedString(40),
    `from` String,
    `to` String,
    value String,
    tx_id String,
    block_num   UInt32(),
    timestamp       DateTime64(3, 'UTC'),
)
ENGINE = MergeTree PRIMARY KEY ("tx_id")
ORDER BY (tx_id,block_num,timestamp);


-- MV for contract --
CREATE MATERIALIZED VIEW transfers_contract_historical_mv
ENGINE = MergeTree()
ORDER BY (contract, `from`,`to`)
POPULATE
AS SELECT * FROM transfers;

-- MV for from --
CREATE MATERIALIZED VIEW transfers_from_historical_mv
ENGINE = MergeTree()
ORDER BY (`from`, contract)
POPULATE
AS SELECT * FROM transfers;

-- MV for from --
CREATE MATERIALIZED VIEW transfers_to_historical_mv
ENGINE = MergeTree()
ORDER BY (`to`, contract)
POPULATE
AS SELECT * FROM transfers;

