CREATE TABLE IF NOT EXISTS Transfers  (
    "id" String,
    address FixedString(40),
    `from` String,
    `to` String,
    value String,
    transaction String,
    block_number    UInt32(),
    timestamp       DateTime64(3, 'UTC'),
)
ENGINE = MergeTree PRIMARY KEY ("id")
ORDER BY (id,timestamp, block_number);

-- Indexes for block_number
ALTER TABLE Transfers ADD INDEX transfers_block_number_index block_number TYPE minmax;

-- MV for contract --
CREATE MATERIALIZED VIEW mv_transfers_contract
ENGINE = MergeTree()
ORDER BY (address, `from`,`to`)
POPULATE
AS SELECT * FROM Transfers;

-- MV for from --
CREATE MATERIALIZED VIEW mv_transfers_from
ENGINE = MergeTree()
ORDER BY (`from`, address)
POPULATE
AS SELECT * FROM Transfers;

-- MV for from --
CREATE MATERIALIZED VIEW mv_transfers_to
ENGINE = MergeTree()
ORDER BY (`to`, address)
POPULATE
AS SELECT * FROM Transfers;