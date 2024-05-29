/**
 * Common models used for protobuf and openapi3 outputs
 */
namespace Models {
    // Use a generic to allow the model to represent a timestamp using different types for protobuf/openapi3
    model BlockInfo<TimestampType> {
        block_num: uint64;
        timestamp: TimestampType;
    }

    model CommonERC20<TimestampType> {
        ...BlockInfo<TimestampType>;
        transaction_id: string;
    }

    model Transfer<TimestampType> {
        address: string;
        from: string;
        to: string;
        value: string;
        ...CommonERC20<TimestampType>;
    }

    model BalanceChange<TimestampType> {
         contract: string;
         owner: string;
         amount: string;
         old_balance: string;
         new_balance: string;
         change_type: int32;
        ...CommonERC20<TimestampType>;
    }

    model Supply<TimestampType> {
        address: string;
        supply: string;
        ...BlockInfo<TimestampType>;
    }

    model Contract<TimestampType>{
        address: string;
        name: string;
        symbol: string;
        decimals: int64;
        ...BlockInfo<TimestampType>;
    }
}
