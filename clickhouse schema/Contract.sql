CREATE TABLE IF NOT EXISTS Contracts  (
    address FixedString(40),
    name String,
    symbol String,
    decimals UInt64,
    block_number    UInt32(),
    timestamp       DateTime64(3, 'UTC'),
)
ENGINE = MergeTree PRIMARY KEY ("address")
ORDER BY (address, timestamp, block_number,);

-- Indexes for block_number and chain --
ALTER TABLE Contracts ADD INDEX Contracts_block_number_index block_number TYPE minmax;