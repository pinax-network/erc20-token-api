CREATE TABLE IF NOT EXISTS Contracts  (
    address FixedString(40),
    name String,
    symbol String,
    decimals UInt64,
    block_number    UInt32(),
    timestamp       DateTime64(3, 'UTC'),
)
ENGINE = MergeTree PRIMARY KEY ("address")
ORDER BY (address, name);
