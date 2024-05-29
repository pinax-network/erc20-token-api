-- Table for balance changes --
CREATE TABLE IF NOT EXISTS balance_changes  (
    "id"            String,
    block_num    UInt32(),
    timestamp       DateTime64(3, 'UTC'),
    contract        FixedString(40),
    owner           FixedString(40),
    amount          UInt256,
    old_balance     UInt256,
    new_balance     UInt256,
    transaction_id  FixedString(64),
    change_type     Int32
)
ENGINE = MergeTree PRIMARY KEY ("id")
ORDER BY (id,timestamp, block_num);

-- Indexes for block_number --
ALTER TABLE balance_changes ADD INDEX balance_changes_block_number_index block_num TYPE minmax;

-- MV for contract --
CREATE MATERIALIZED VIEW mv_balance_changes_contract
ENGINE = MergeTree()
ORDER BY (contract, owner)
POPULATE
AS SELECT * FROM balance_changes;

-- MV for owner --
CREATE MATERIALIZED VIEW mv_balance_changes_owner
ENGINE = MergeTree()
ORDER BY (owner, contract)
POPULATE
AS SELECT * FROM balance_changes;